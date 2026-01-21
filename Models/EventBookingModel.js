const pool = require("../Postgres_config");
const transporter = require("../mailer");

/* ======================================================
   Event Booking Model
   Purpose: Handle organization bookings for events
   Table: eventbookings (organizations book events created by admin)
   ====================================================== */

/* ------------------------------
   1. Get Upcoming Event
------------------------------ */
async function getUpcomingEvent(eventId) {
  const result = await pool.query(
    `
    SELECT *
    FROM events
    WHERE eventid = $1 AND status = 'Upcoming'
    `,
    [eventId]
  );

  return result.rows[0] || null;
}

/* ------------------------------
   2. Get Available Events (not yet booked)
------------------------------ */
async function getAvailableEvents() {
  const result = await pool.query(
    `
    SELECT 
      e.eventid,
      e.eventname,
      e.eventdate,
      e.location,
      e.description,
      e.requiredvolunteers,
      e.maximumparticipant,
      e.status,
      e.createdat,
      e.peoplesignup
    FROM events e
    WHERE e.organizationid IS NULL
      AND e.status = 'Upcoming'
      AND e.eventdate > NOW()
      AND NOT EXISTS (
        SELECT 1 
        FROM eventbookings eb
        WHERE eb.eventid = e.eventid 
          AND eb.status = 'Approved'
      )
    ORDER BY e.eventdate ASC
    `
  );

  return result.rows;
}

/* ------------------------------
   3. Create Booking Request (Pending status)
------------------------------ */
async function createBookingRequest(bookingData) {
  const { eventId, organizationId, participants, sessionHeadName, sessionHeadContact, sessionHeadEmail } = bookingData;
  
  const result = await pool.query(
    `
    INSERT INTO eventbookings 
      (eventid, organizationid, participants, status, session_head_name, session_head_contact, session_head_email)
    VALUES ($1, $2, $3, 'Pending', $4, $5, $6)
    RETURNING *
    `,
    [eventId, organizationId, participants, sessionHeadName || null, sessionHeadContact || null, sessionHeadEmail || null]
  );

  return result.rows[0];
}

/* ------------------------------
   4. Get All Booking Requests (for admin)
------------------------------ */
async function getAllBookingRequests() {
  const result = await pool.query(
    `
    SELECT 
      eb.bookingid,
      eb.eventid,
      eb.organizationid,
      eb.participants,
      eb.status,
      eb.session_head_name,
      eb.session_head_contact,
      eb.session_head_email,
      eb.createdat,
      eb.reviewedby,
      eb.reviewdate,
      e.eventname,
      e.eventdate,
      e.location,
      e.description,
      e.peoplesignup,
      o.orgname
    FROM eventbookings eb
    INNER JOIN events e ON eb.eventid = e.eventid
    LEFT JOIN organizations o ON eb.organizationid = o.organizationid
    ORDER BY eb.createdat DESC
    `
  );

  return result.rows;
}

/* ------------------------------
   5. Get Booking Request By ID
------------------------------ */
async function getBookingRequestById(bookingId) {
  const result = await pool.query(
    `
    SELECT 
      eb.*,
      e.eventname,
      e.eventdate,
      e.location,
      e.description,
      o.orgname
    FROM eventbookings eb
    INNER JOIN events e ON eb.eventid = e.eventid
    LEFT JOIN organizations o ON eb.organizationid = o.organizationid
    WHERE eb.bookingid = $1
    `,
    [bookingId]
  );

  return result.rows[0] || null;
}

/* ------------------------------
   6. Approve Booking Request
------------------------------ */
async function approveBookingRequest(bookingId, reviewedBy) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Update booking status
    const bookingResult = await client.query(
      `
      UPDATE eventbookings
      SET status = 'Approved',
          reviewedby = $2,
          reviewdate = NOW()
      WHERE bookingid = $1
      RETURNING *
      `,
      [bookingId, reviewedBy]
    );

    const booking = bookingResult.rows[0];
    if (!booking) {
      throw new Error('Booking not found');
    }

    // 2. Update event to assign organization
    await client.query(
      `
      UPDATE events
      SET organizationid = $2,
          updatedat = NOW()
      WHERE eventid = $1
      `,
      [booking.eventid, booking.organizationid]
    );

    // 3. Update people sign up count
    await client.query(
      `
      UPDATE events
      SET peoplesignup = COALESCE(peoplesignup, 0) + $2
      WHERE eventid = $1
      `,
      [booking.eventid, booking.participants]
    );

    // 4. Calculate and update volunteers needed
    const volunteersNeeded = Math.ceil(booking.participants / 5);
    await client.query(
      `
      UPDATE events
      SET requiredvolunteers = COALESCE(requiredvolunteers, 0) + $2,
          updatedat = NOW()
      WHERE eventid = $1
      `,
      [booking.eventid, volunteersNeeded]
    );

    await client.query('COMMIT');
    
    return booking;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ----------------------------
// Send Email Notification to All Volunteers (Event Head Assigned)
// ----------------------------
async function sendEventHeadAssignedToVolunteers(eventData, bookingData) {
  try {
    const volunteers = await getAllVolunteerEmails();
    if (!volunteers || volunteers.length === 0) {
      console.log("No volunteers found to notify");
      return;
    }

    const eventName = eventData?.eventname || eventData?.EventName || "Event";
    const eventDate = eventData?.eventdate || eventData?.EventDate;
    const eventLocation = eventData?.location || eventData?.Location || "TBD";

    const headName = bookingData?.session_head_name || bookingData?.eventHeadName || "Event Head";
    const headContact = bookingData?.session_head_contact || bookingData?.eventHeadContact || "";
    const headEmail = bookingData?.session_head_email || bookingData?.eventHeadEmail || "";
    const headProfile = bookingData?.session_head_profile || bookingData?.eventHeadProfile || "";

    const emailSubject = `Event Head Assigned: ${eventName}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Event Head Assigned</h2>
        <p>Hello Volunteer, this is from Cycling Without Age.</p>
        <p>The institution has assigned an event head. You can contact them if needed.</p>
        <div style="background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;">
          <p><strong>Event:</strong> ${eventName}</p>
          ${eventDate ? `<p><strong>Date:</strong> ${new Date(eventDate).toLocaleString()}</p>` : ''}
          <p><strong>Location:</strong> ${eventLocation}</p>
        </div>
        <div style="margin-top:14px;background:#ffffff;padding:16px;border-radius:10px;border:1px solid #e2e8f0;">
          <p style="margin-top:0;"><strong>Event Head:</strong> ${headName}</p>
          ${headContact ? `<p><strong>Contact:</strong> ${headContact}</p>` : ''}
          ${headEmail ? `<p><strong>Email:</strong> ${headEmail}</p>` : ''}
          ${headProfile ? `<p><strong>Profile:</strong> ${headProfile}</p>` : ''}
        </div>
        <p style="color:#64748b;font-size:12px;margin-top:24px;">Automated email, please do not reply.</p>
      </div>
    `;

    const emailPromises = volunteers.map(async (volunteer) => {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: volunteer.email,
          subject: emailSubject,
          html: emailHtml
        });
      } catch (emailError) {
        console.error(`❌ Failed to send head-assigned email to ${volunteer.email}:`, emailError);
      }
    });

    await Promise.all(emailPromises);
    console.log(`✅ Event head assigned emails sent to ${volunteers.length} volunteers`);
  } catch (err) {
    console.error("Error sending event head assigned emails:", err);
  }
}

// ----------------------------
// Get All Volunteer Emails
// ----------------------------
async function getAllVolunteerEmails() {
  try {
    const query = `
      SELECT id, email, name
      FROM users
      WHERE role = 'volunteer' AND email IS NOT NULL
      ORDER BY name
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (err) {
    console.error("Error fetching volunteer emails:", err);
    throw err;
  }
}

// ----------------------------
// Send Email Notification to All Volunteers
// ----------------------------
async function sendEventNotificationToVolunteers(eventData, bookingData) {
  try {
    // Get all volunteer emails
    const volunteers = await getAllVolunteerEmails();
    
    if (!volunteers || volunteers.length === 0) {
      console.log("No volunteers found to notify");
      return;
    }

    // Prepare email content
    const eventName = eventData.eventname || eventData.EventName || "New Event";
    const eventDate = eventData.eventdate || eventData.EventDate || "TBD";
    const eventLocation = eventData.location || eventData.Location || "TBD";
    const eventDescription = eventData.description || eventData.Description || "";
    const requiredVolunteers = eventData.requiredvolunteers || eventData.RequiredVolunteers || 0;
    const organizationName = bookingData.organizationname || "Organization";

    const emailSubject = `New Volunteer Opportunity: ${eventName}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea8d2a;">🎉 New Volunteer Opportunity Available!</h2>
        <p>Hello Volunteer,</p>
        <p>A new event has been approved and is now available for volunteer sign-up:</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fbbf24;">
          <h3 style="color: #1e293b; margin-top: 0;">${eventName}</h3>
          <p><strong>📅 Date:</strong> ${new Date(eventDate).toLocaleString()}</p>
          <p><strong>📍 Location:</strong> ${eventLocation}</p>
          <p><strong>👥 Volunteers Needed:</strong> ${requiredVolunteers}</p>
          <p><strong>🏢 Organization:</strong> ${organizationName}</p>
          ${eventDescription ? `<p><strong>📝 Description:</strong> ${eventDescription}</p>` : ''}
        </div>
        <p style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>✨ This event is now live!</strong> Log in to your volunteer account to sign up and help make a difference in your community.
        </p>
        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Thank you for being part of our volunteer community!<br>Best regards,<br>Happy Volunteer Team</p>
      </div>
    `;

    // Send email to each volunteer
    const emailPromises = volunteers.map(async (volunteer) => {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: volunteer.email,
          subject: emailSubject,
          html: emailHtml,
        });
        console.log(`✅ Email sent to volunteer ${volunteer.email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send email to volunteer ${volunteer.email}:`, emailError);
      }
    });

    await Promise.all(emailPromises);
    console.log(`✅ Event notification emails sent to ${volunteers.length} volunteers`);

  } catch (err) {
    console.error("Error sending event notification emails to volunteers:", err);
    // Don't throw error - email failure shouldn't break booking approval
  }
}

/* ------------------------------
   7. Reject Booking Request
------------------------------ */
async function rejectBookingRequest(bookingId, reviewedBy) {
  const result = await pool.query(
    `
    UPDATE eventbookings
    SET status = 'Rejected',
        reviewedby = $2,
        reviewdate = NOW()
    WHERE bookingid = $1
    RETURNING *
    `,
    [bookingId, reviewedBy]
  );

  return result.rows[0] || null;
}

/* ------------------------------
   8. Get Organization's Bookings
------------------------------ */
async function getOrganizationBookings(organizationId) {
  const result = await pool.query(
    `
    SELECT 
      eb.*,
      e.eventname,
      e.eventdate,
      e.location,
      e.description,
      e.status AS eventstatus
    FROM eventbookings eb
    INNER JOIN events e ON eb.eventid = e.eventid
    WHERE eb.organizationid = $1
    ORDER BY eb.createdat DESC
    `,
    [organizationId]
  );

  return result.rows;
}

/* ------------------------------
   9. Assign Event Head (Update session head info)
------------------------------ */
async function assignEventHead(bookingId, eventHeadData) {
  const { eventHeadName, eventHeadContact, eventHeadEmail, eventHeadProfile } = eventHeadData;
  
  const result = await pool.query(
    `
    UPDATE eventbookings
    SET session_head_name = $2,
        session_head_contact = $3,
        session_head_email = $4,
        session_head_profile = $5,
        updatedat = NOW()
    WHERE bookingid = $1
    RETURNING *
    `,
    [bookingId, eventHeadName, eventHeadContact, eventHeadEmail, eventHeadProfile || null]
  );

  if (result.rows.length === 0) {
    throw new Error('Booking not found');
  }

  return result.rows[0];
}

/* ------------------------------
   10. Check if Event has Participants
------------------------------ */
async function hasParticipants(eventId) {
  const result = await pool.query(
    `
    SELECT COALESCE(peoplesignup, 0) AS participants
    FROM events
    WHERE eventid = $1
    `,
    [eventId]
  );

  return result.rows[0]?.participants > 0;
}

/* ------------------------------
   10. Delete Events with No Participants (for auto-delete)
------------------------------ */
async function deleteEventsWithNoParticipants() {
  const result = await pool.query(
    `
    DELETE FROM events
    WHERE organizationid IS NULL
      AND (peoplesignup IS NULL OR peoplesignup = 0)
      AND eventdate > NOW() + INTERVAL '1 day'
      AND eventdate < NOW() + INTERVAL '2 days'
      AND status = 'Upcoming'
    RETURNING eventid, eventname, eventdate
    `
  );

  return result.rows;
}

module.exports = {
  getUpcomingEvent,
  getAvailableEvents,
  createBookingRequest,
  getAllBookingRequests,
  getBookingRequestById,
  approveBookingRequest,
  rejectBookingRequest,
  getOrganizationBookings,
  assignEventHead,
  hasParticipants,
  deleteEventsWithNoParticipants,
  getAllVolunteerEmails,
  sendEventNotificationToVolunteers,
  sendEventHeadAssignedToVolunteers
};
