const OrganizationRequestModel = require("../Models/OrganizationRequestModel");


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
    await OrganizationRequestModel.approveRequest(id);
    res.status(200).json({ message: "Request approved successfully" });
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
    await OrganizationRequestModel.rejectRequest(id);
    res.status(200).json({ message: "Request rejected successfully" });
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


// ======================================================
module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  checkRequestStatus,
  deleteRequest,getUserOrganizationID,
};

