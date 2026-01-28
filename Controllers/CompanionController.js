const CompanionModel = require("../Models/CompanionModel");
const NotificationModel = require("../Models/notification_model");

async function getFetch() {
  if (typeof globalThis.fetch === "function") return globalThis.fetch.bind(globalThis);
  const mod = await import("node-fetch");
  return mod.default;
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function weatherToTips(classification) {
  const tips = [];
  if (classification === "rain") {
    tips.push("It may rain. Bring a small umbrella or raincoat and wear non-slip shoes.");
    tips.push("If the ground is wet, walk slowly and hold handrails when available.");
  } else if (classification === "hot") {
    tips.push("It may be hot. Drink water regularly and wear light, breathable clothing.");
    tips.push("Bring a hat and try to stay in shade when waiting.");
  } else {
    tips.push("Weather looks mild. Bring a light jacket in case it gets windy.");
  }
  return tips;
}

async function classifyWeatherOpenMeteo({ lat, lng }) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { classification: "mild", raw: null };
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=temperature_2m,precipitation,weather_code`;

  const fetchFn = await getFetch();
  const res = await fetchFn(url);
  if (!res.ok) {
    return { classification: "mild", raw: null };
  }

  const data = await res.json();
  const cur = data?.current;
  const temp = Number(cur?.temperature_2m);
  const precip = Number(cur?.precipitation);
  const code = Number(cur?.weather_code);

  let classification = "mild";
  if ((Number.isFinite(precip) && precip >= 1) || (Number.isFinite(code) && code >= 51 && code <= 99)) {
    classification = "rain";
  }
  if (Number.isFinite(temp) && temp >= 31) {
    classification = "hot";
  }

  return { classification, raw: { temp, precip, code } };
}

function scoreEvent({ event, preferredLocation, weatherClass }) {
  const reasons = [];

  let locationScore = 0.5;
  if (preferredLocation && event.location && String(event.location).toLowerCase().includes(String(preferredLocation).toLowerCase())) {
    locationScore = 1;
    reasons.push("Matches your preferred area.");
  } else if (preferredLocation) {
    reasons.push("Does not exactly match your preferred area, but still available.");
  } else {
    reasons.push("We used available events because no preferred area is set yet.");
  }

  const volunteerNeed = Number(event.requiredvolunteers || 0);
  const volunteerSigned = Number(event.volunteer_signup_count || 0);
  const supportRatio = volunteerNeed <= 0 ? 1 : clamp01(volunteerSigned / volunteerNeed);

  let supportScore = supportRatio;
  if (supportRatio >= 0.8) reasons.push("Good volunteer support availability.");
  else if (supportRatio >= 0.4) reasons.push("Volunteer support is building up.");
  else reasons.push("Volunteer support is still low, but you can still book early.");

  let weatherScore = 1;
  if (weatherClass === "rain") {
    weatherScore = 0.65;
    reasons.push("Weather may be rainy, so plan accordingly.");
  } else if (weatherClass === "hot") {
    weatherScore = 0.75;
    reasons.push("Weather may be hot, so stay hydrated.");
  } else {
    reasons.push("Weather is expected to be mild.");
  }

  const score = clamp01(0.45 * locationScore + 0.35 * supportScore + 0.20 * weatherScore);
  return { score, reasons };
}

async function getRecommendation(req, res) {
  try {
    const elderlyId = Number(req.query.elderlyId || req.user?.id);
    if (!elderlyId) return res.status(400).json({ message: "elderlyId is required" });

    if (req.user?.id && Number(req.user.id) !== elderlyId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const cache = await CompanionModel.getUserProfileCache(elderlyId);

    const lat = cache?.lastLat ?? null;
    const lng = cache?.lastLng ?? null;

    const weather = await classifyWeatherOpenMeteo({ lat, lng });
    const weatherTips = weatherToTips(weather.classification);

    const preferredLocation = cache?.preferredLocation || null;
    const events = await CompanionModel.getUpcomingVolunteerEvents({ preferredLocation, limit: 20 });

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(200).json({
        recommendedRide: null,
        score: 0,
        reasons: ["No upcoming rides found that match your current preferences."],
        weatherTips,
        meta: { preferredLocation }
      });
    }

    const scored = events
      .map((ev) => {
        const { score, reasons } = scoreEvent({
          event: ev,
          preferredLocation,
          weatherClass: weather.classification
        });
        return { event: ev, score, reasons };
      })
      .sort((a, b) => b.score - a.score);

    const top = scored[0];
    const topList = scored.slice(0, 5).map((item) => ({
      recommendedRide: {
        eventId: item.event.eventid,
        eventName: item.event.eventname,
        eventDate: item.event.eventdate,
        location: item.event.location,
        description: item.event.description,
        requiredVolunteers: item.event.requiredvolunteers,
        volunteerSignupCount: item.event.volunteer_signup_count
      },
      score: item.score,
      reasons: item.reasons
    }));

    return res.status(200).json({
      recommendations: topList,
      recommendedRide: {
        eventId: top.event.eventid,
        eventName: top.event.eventname,
        eventDate: top.event.eventdate,
        location: top.event.location,
        description: top.event.description,
        requiredVolunteers: top.event.requiredvolunteers,
        volunteerSignupCount: top.event.volunteer_signup_count
      },
      score: top.score,
      reasons: top.reasons,
      weatherTips,
      meta: {
        preferredLocation,
        weather: weather.raw
      }
    });
  } catch (err) {
    console.error("[companion] recommendation error:", err);
    return res.status(500).json({ message: "Failed to compute recommendation" });
  }
}

async function book(req, res) {
  try {
    const { elderlyId, eventId, specialNeeds, notes, preferredLocation, lastLat, lastLng } = req.body || {};
    const uid = Number(elderlyId || req.user?.id);
    const eid = Number(eventId);

    if (!uid || !eid) return res.status(400).json({ message: "elderlyId and eventId are required" });
    if (req.user?.id && Number(req.user.id) !== uid) return res.status(403).json({ message: "Forbidden" });

    if (preferredLocation || lastLat || lastLng) {
      await CompanionModel.upsertUserProfileCache({
        userId: uid,
        preferredLocation: preferredLocation || null,
        lastLat: lastLat ?? null,
        lastLng: lastLng ?? null
      });
    }

    const signup = await CompanionModel.createElderlySignup({
      elderlyId: uid,
      eventId: eid,
      specialNeeds: specialNeeds || null,
      notes: notes || null
    });

    await CompanionModel.logTelemetry({
      userId: uid,
      type: "elderly_signup_created",
      payload: { eventId: eid }
    });

    // Schedule reminders (requires notifications.scheduled_for + notifications.visibleat migration)
    const next = await CompanionModel.getNextRideForElderly(uid);
    const eventDate = next?.eventDate ? new Date(next.eventDate) : null;

    if (eventDate) {
      const mapLink = CompanionModel.buildMapLink(next.location);

      const remind24 = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
      const remind2 = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000);

      const weather = await classifyWeatherOpenMeteo({ lat: lastLat ?? null, lng: lastLng ?? null });
      const tips = weatherToTips(weather.classification);

      await NotificationModel.createNotification({
        userId: uid,
        type: "RIDE_REMINDER_24H",
        title: "Ride reminder (24h)",
        message: `Your ride is coming up tomorrow. ${tips[0] || ""}`.trim(),
        payload: { eventId: eid, when: "24h", weatherTips: tips, mapLink },
        scheduledFor: remind24
      });

      const head = await CompanionModel.getEventHeadForEvent(eid);
      const headText = head?.contact ? `Event head contact: ${head.contact}` : head?.email ? `Event head email: ${head.email}` : "";

      await NotificationModel.createNotification({
        userId: uid,
        type: "RIDE_REMINDER_2H",
        title: "Ride reminder (2h)",
        message: `Your ride is soon. Use the map link for directions. ${headText}`.trim(),
        payload: { eventId: eid, when: "2h", mapLink, eventHead: head },
        scheduledFor: remind2
      });
    }

    return res.status(201).json({ message: "Signed up successfully", signup });
  } catch (err) {
    if (String(err?.message || "").includes("already")) {
      return res.status(400).json({ message: "You already signed up for this event." });
    }
    console.error("[companion] book error:", err);
    return res.status(500).json({ message: "Failed to sign up" });
  }
}

async function getNextRide(req, res) {
  try {
    const elderlyId = Number(req.query.elderlyId || req.user?.id);
    if (!elderlyId) return res.status(400).json({ message: "elderlyId is required" });
    if (req.user?.id && Number(req.user.id) !== elderlyId) return res.status(403).json({ message: "Forbidden" });

    const next = await CompanionModel.getNextRideForElderly(elderlyId);
    if (!next) return res.status(200).json({ nextRide: null, message: "No upcoming rides signed up." });

    return res.status(200).json({ nextRide: next });
  } catch (err) {
    console.error("[companion] next-ride error:", err);
    return res.status(500).json({ message: "Failed to load next ride" });
  }
}

async function getMyNotifications(req, res) {
  try {
    const userId = Number(req.query.userId || req.user?.id);
    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (req.user?.id && Number(req.user.id) !== userId) return res.status(403).json({ message: "Forbidden" });

    const unreadOnly = String(req.query.unreadOnly ?? "false").toLowerCase() === "true";
    const limit = Number(req.query.limit ?? 50);

    const items = await NotificationModel.getUserNotifications(userId, { unreadOnly, limit, visibleOnly: true });
    return res.status(200).json(items);
  } catch (err) {
    console.error("[api/notifications/my] error:", err);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
}

module.exports = {
  getRecommendation,
  book,
  getNextRide,
  getMyNotifications
};
