const OrganizationRequestModel = require("../Models/OrganizationRequestModel");

const pool = require("../Postgres_config");
const transporter = require("../mailer");
const NotificationModel = require("../Models/notification_model");


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


async function getUserOrganizationID(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = req.user.id;
    
    if (!userId) {
      console.error("getUserOrganizationID: userId is missing from req.user:", req.user);
      return res.status(400).json({ message: "User ID is missing" });
    }

    // Ensure userId is an integer (PostgreSQL userid column is INT)
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      console.error("getUserOrganizationID: userId is not a valid number:", userId);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const result = await pool.query(
      `SELECT organizationid FROM userorganizations WHERE userid = $1 LIMIT 1`,
      [userIdInt]
    );

    if (result.rows.length === 0) {
      // Return null instead of 404 - institution users might not have organization yet
      return res.status(200).json({ organizationId: null, message: "User is not associated with any organization" });
    }

    const organizationId = result.rows[0].organizationid;
    res.status(200).json({ organizationId: organizationId });
  } catch (error) {
    console.error("getUserOrganizationID error:", error);
    console.error("Error details:", error.stack);
    console.error("Error message:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}




async function createRequest(req, res) {
  try {
    const { OrganizationID, EventName, EventDate, Description, RequiredVolunteers, RequesterID } = req.body;

    // Map request body to model format (convert to lowercase for PostgreSQL)
    const requestData = {
      organizationid: OrganizationID,
      requesterid: RequesterID,
      eventname: EventName,
      eventdate: EventDate,
      description: Description,
      requiredvolunteers: RequiredVolunteers
    };

    await OrganizationRequestModel.createRequest(requestData);
    
    res.status(200).json({ message: "Organization request submitted successfully!" });
  } catch (err) {
    console.error("createRequest error:", err);
    res.status(500).json({ message: "Failed to submit request", error: err.message });
  }
}


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
    const userId = req.user.id;
    const organizationID = await OrganizationRequestModel.getOrganisationIDByUserID(userId);
    if (!organizationID) {
      return res.status(404).json({ message: "Organization not found for user" });
    }
    res.status(200).json({ organizationID });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


async function getAllOrganizationRequests(req, res) {
  try {
    const organizationID = await getOrganisationIDByUserID(req.user.id);
    if (!organizationID) {
      return res.status(404).json({ message: "Organization not found for user" });
    }

    const requests = await OrganizationRequestModel.getAllOrganizationRequests(organizationID);
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}







async function getEventPeopleSignups(req, res) {
  const { eventID } = req.params;
  try {
    const signups = await OrganizationRequestModel.getEventPeopleSignups(eventID);
    res.status(200).json(signups);
  }
  catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  } 
}




// ======================================================
module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  checkRequestStatus,
  deleteRequest,getUserOrganizationID,
  getEventPeopleSignups,getAllOrganizationRequests
};

