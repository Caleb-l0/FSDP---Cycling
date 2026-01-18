const OrganizationRequestModel = require("../Models/OrganizationRequestModel");


// ======================================================
// Organization Request Controller
// Purpose: Handle organization requests for events
// Table: volunteerrequests (organizations request events to be created)
// ======================================================


async function getUserOrganizationID(req, res) {
  try {
    const userId = req.user.id; 
    const organizationID = await OrganizationRequestModel.getOrganizationIDByUserID(userId);
    if (!organizationID) {
      return res.status(404).json({ message: "Organization not found for user" });
    }
    res.status(200).json({ organizationID });
  } catch (error) { 
    console.error("Error in getUserOrganizationID controller:", error);
    res.status(500).json({ message: "Server error", error });
  }
}


// ======================================================
// 1. Create Organization Request
// ======================================================
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
  deleteRequest,
  getUserOrganizationID
};

