const OrganizationRequestModel = require("../Models/OrganizationRequestModel");

const pool = require("../Postgres_config");
const transporter = require("../mailer");
const NotificationModel = require("../Models/notification_model");
const { assign } = require("nodemailer/lib/shared");


// ======================================================
// Organization Request Controller
// Purpose: Handle organization requests for events
// Table: volunteerrequests (organizations request events to be created)
// ======================================================


// ======================================================
// Note: getUserOrganizationID has been moved to GetEmail_Controller.js
// All organization ID requests should use /user/organization-id endpoint
// ======================================================
// 1. Create Organization Request
// ======================================================








// ======================================================
// 2. Get All Requests
// ======================================================
async function getAllRequests(req, res) {
  try {
    const requests = await OrganizationRequestModel.getAllRequests();
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


// ======================================================
// 3. Get Request By ID
// ======================================================
async function getRequestById(req, res) {
  const { id } = req.params;
  try {
    const request = await OrganizationRequestModel.getRequestById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


// ======================================================
// 4. Approve Request
// ======================================================
async function approveRequest(req, res) {
  const { id } = req.params;
  try {
    const request = await OrganizationRequestModel.getRequestById(id);
    await OrganizationRequestModel.approveRequest(id);
    res.status(200).json({ message: "Request approved successfully" });

    // Email + notify institution users (background)
    if (request?.organizationid) {
      const orgId = request.organizationid;
      const eventName = request.eventname || 'Event';
      const eventDate = request.eventdate;

      setImmediate(async () => {
        try {
          const orgUsers = await pool.query(
            `
              SELECT u.id, u.email, u.name
              FROM userorganizations uo
              JOIN users u ON uo.userid = u.id
              WHERE uo.organizationid = $1
                AND LOWER(TRIM(u.role)) = 'institution'
            `,
            [orgId]
          );

          const rows = orgUsers.rows || [];
          if (rows.length === 0) return;

          const userIds = rows.map(r => r.id).filter(Boolean);
          await NotificationModel.createNotificationsForUsers({
            userIds,
            type: 'APPLICATION_APPROVED',
            title: 'Application approved',
            message: `Your application has been approved for: ${eventName}.`,
            payload: { requestId: request.requestid || id, organizationId: orgId, eventName, eventDate }
          });

          const subject = `Application Approved: ${eventName}`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color:#16a34a;">Application Approved</h2>
              <p>Your institution application has been approved.</p>
              <div style="background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;">
                <p><strong>Event:</strong> ${eventName}</p>
                ${eventDate ? `<p><strong>Date:</strong> ${new Date(eventDate).toLocaleString()}</p>` : ''}
              </div>
              <p>You can now assign the event head and provide the head information.</p>
              <p style="color:#64748b;font-size:12px;margin-top:24px;">Automated email, please do not reply.</p>
            </div>
          `;

          for (const u of rows) {
            if (!u.email) continue;
            try {
              await transporter.sendMail({ to: u.email, subject, html });
            } catch (e) {
              console.error('[approveRequest] Failed to email institution user:', u.email, e);
            }
          }
        } catch (e) {
          console.error('[approveRequest] background notify/email failed:', e);
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


// ======================================================
// 5. Reject Request
// ======================================================
async function rejectRequest(req, res) {
  const { id } = req.params;
  try {
    const request = await OrganizationRequestModel.getRequestById(id);
    await OrganizationRequestModel.rejectRequest(id);
    res.status(200).json({ message: "Request rejected successfully" });

    // Email + notify institution users (background)
    if (request?.organizationid) {
      const orgId = request.organizationid;
      const eventName = request.eventname || 'Event';
      const eventDate = request.eventdate;

      setImmediate(async () => {
        try {
          const orgUsers = await pool.query(
            `
              SELECT u.id, u.email, u.name
              FROM userorganizations uo
              JOIN users u ON uo.userid = u.id
              WHERE uo.organizationid = $1
                AND LOWER(TRIM(u.role)) = 'institution'
            `,
            [orgId]
          );

          const rows = orgUsers.rows || [];
          if (rows.length === 0) return;

          const userIds = rows.map(r => r.id).filter(Boolean);
          await NotificationModel.createNotificationsForUsers({
            userIds,
            type: 'APPLICATION_REJECTED',
            title: 'Application rejected',
            message: `Your application was rejected for: ${eventName}.`,
            payload: { requestId: request.requestid || id, organizationId: orgId, eventName, eventDate }
          });

          const subject = `Application Rejected: ${eventName}`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color:#dc2626;">Application Rejected</h2>
              <p>Your institution application has been rejected.</p>
              <div style="background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;">
                <p><strong>Event:</strong> ${eventName}</p>
                ${eventDate ? `<p><strong>Date:</strong> ${new Date(eventDate).toLocaleString()}</p>` : ''}
              </div>
              <p>You may apply again if the event becomes available later.</p>
              <p style="color:#64748b;font-size:12px;margin-top:24px;">Automated email, please do not reply.</p>
            </div>
          `;

          for (const u of rows) {
            if (!u.email) continue;
            try {
              await transporter.sendMail({ to: u.email, subject, html });
            } catch (e) {
              console.error('[rejectRequest] Failed to email institution user:', u.email, e);
            }
          }
        } catch (e) {
          console.error('[rejectRequest] background notify/email failed:', e);
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


// ======================================================
// 6. Check Request Status
// ======================================================
async function checkRequestStatus(req, res) {
  const { id } = req.params;
  try {
    const result = await OrganizationRequestModel.checkRequestStatus(id);
    if (!result) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json({ status: result.status });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


// ======================================================
// 7. Delete Request
// ======================================================
async function deleteRequest(req, res) {
  const { id } = req.params;
  try {
    const request = await OrganizationRequestModel.deleteRequest(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json({ message: "Request deleted successfully", request });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

async function getUserOrganizationID(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = req.user.id;
    const organizationId = await OrganizationRequestModel.getOrganisationIDByUserID(userId);
    if (!organizationId) {
      return res.status(200).json({ organizationId: null, message: "User is not associated with any organization" });
    }
    res.status(200).json({ organizationId });
  } catch (error) {
    // Fallback: do not hard-fail the UI; return null org id
    console.error('getUserOrganizationID error:', error);
    res.status(200).json({ organizationId: null, message: "Unable to resolve organization for user" });
  }
}


async function getAllOrganizationRequests(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const organizationID = await OrganizationRequestModel.getOrganisationIDByUserID(req.user.id);
    if (!organizationID) {
      return res.status(200).json([]);
    }

    const requests = await OrganizationRequestModel.getAllOrganizationRequests(organizationID);
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}







async function getEventSignups(req, res) {
  const { eventID } = req.params;
  try {
    const data = await OrganizationRequestModel.getEventSignups(eventID);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

async function getEventPeopleSignups(req, res) {
  const { eventID } = req.params;
  try {
    console.log('Controller called with eventID:', eventID);
    const signups = await OrganizationRequestModel.getEventPeopleSignups(eventID);
    console.log('Controller received from model:', signups);
    console.log('Type of signups:', typeof signups);
    console.log('Is array?', Array.isArray(signups));
    res.status(200).json(signups);
  }
  catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({ message: "Server Error", error: error.message });
  } 
}

async function requestEventBooking(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const requesterId = req.user.id;

    const eventId = req.body.eventId;
    if (!eventId) {
      return res.status(400).json({ message: "eventId is required" });
    }

    const organizationId = await OrganizationRequestModel.getOrganisationIDByUserID(requesterId);
    if (!organizationId) {
      return res.status(400).json({ message: "User is not associated with any organization" });
    }

    const created = await OrganizationRequestModel.createEventBookingRequest(
      organizationId,
      requesterId,
      eventId
    );

    return res.status(201).json({
      message: "Event booking request submitted successfully!",
      data: created
    });
  } catch (err) {
    console.error("requestEventBooking error:", err);

    const msg = err?.message || "Unknown error";

    // map common business errors -> proper status
    if (msg === "Event not found") return res.status(404).json({ message: msg });
    if (msg.includes("already assigned")) return res.status(409).json({ message: msg });
    if (msg.includes("pending request")) return res.status(409).json({ message: msg });
    if (msg.startsWith("Cannot request booking yet")) return res.status(400).json({ message: msg });
    if (msg.startsWith("Invalid")) return res.status(400).json({ message: msg });

    return res.status(500).json({ message: "Failed to submit event booking request", error: msg });
  }
}




async function assignEventHead(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const requesterId = req.user.id;
    const requestId = Number(req.params.requestId);

    if (!requestId) {
      return res.status(400).json({ message: "Invalid requestId" });
    }

    const {
      eventHeadName,
      eventHeadContact,
      eventHeadEmail,
      eventHeadProfile
    } = req.body;

    if (!eventHeadName || !eventHeadContact || !eventHeadEmail) {
      return res.status(400).json({ message: "Missing required event head fields" });
    }

    const organizationId = await OrganizationRequestModel.getOrganisationIDByUserID(requesterId);
    if (!organizationId) {
      return res.status(400).json({ message: "User is not associated with any organization" });
    }

    const booking = await OrganizationRequestModel.assignEventHeadToRequest({
      requestId,
      organizationId,
      eventHeadName,
      eventHeadContact,
      eventHeadEmail,
      eventHeadProfile
    });

    return res.status(200).json({
      message: "Event booking created successfully",
      data: booking
    });
  } catch (err) {
    console.error("assignEventHead error:", err);

    const msg = err?.message || "Unknown error";

    if (msg.includes("not found")) return res.status(404).json({ message: msg });
    if (msg.includes("already been booked")) return res.status(409).json({ message: msg });

    return res.status(500).json({ message: "Failed to assign event head", error: msg });
  }
}


async function getOrganizationMembers(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const organizationID = await OrganizationRequestModel.getOrganisationIDByUserID(req.user.id);
    if (!organizationID) {
      return res.status(200).json([]);
    }
    const members = await OrganizationRequestModel.getOrganizationMembers(organizationID);
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

// ======================================================
module.exports = {

  getAllRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  checkRequestStatus,
  deleteRequest,
  getUserOrganizationID,
  getEventSignups,
  getEventPeopleSignups,
  getAllOrganizationRequests,
  requestEventBooking, assignEventHead,getOrganizationMembers
};

