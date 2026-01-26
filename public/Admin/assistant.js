import express from "express";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.get("/next-event", async (req, res) => {
  try {
    // TODO: replace with real logged-in volunteer ID
    const volunteerId = req.session.volunteerId || 1;

    // TODO: replace with real DB query
    const event = {
      name: "Food Distribution",
      date: "21 March 2026",
      time: "9:00 AM",
      location: "Bedok Community Centre"
    };

    // If no event
    if (!event) {
      return res.json({
        message: "You do not have any upcoming volunteering right now."
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You help elderly volunteers understand their schedule. Use short, simple, friendly sentences."
        },
        {
          role: "user",
          content: `
Explain the following volunteering details clearly:

Event: ${event.name}
Date: ${event.date}
Time: ${event.time}
Location: ${event.location}

Use no more than 5 sentences.
          `
        }
      ]
    });

    res.json({
      message: completion.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to generate volunteering information."
    });
  }
});

export default router;