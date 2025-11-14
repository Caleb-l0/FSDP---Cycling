const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const RequestModel = require("../Models/GetRequestModel");
const { get } = require("mongoose");


async function getAllRequests(req, res) {
    try {
        const requests = await RequestModel.getAllRequests();
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }   
}

async function getRequestById(req, res) {
    const { id } = req.params;
    try {
        const request = await RequestModel.getRequestById(id);
        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

async function deleteRequest(requestID) {
  const pool = await sql.connect(db);

  await pool.request()
    .input("RequestID", sql.Int, requestID)
    .query(`DELETE FROM VolunteerRequests WHERE RequestID = @RequestID`);

  return true;
}

async function getRequestByOragnization(req, res) {
    const { organizationId } = req.params;                      
    try {   
        const requests = await RequestModel.getRequestByOragnization(organizationId);
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}   


async function getRequestByHistory(req, res) {
    const { date } = req.params;    
    try {
        const requests = await RequestModel.getRequestByHistory(date);
        res.status(200).json(requests);
    }
    catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

module.exports = { getAllRequests, getRequestByOragnization, getRequestByHistory,getRequestById,deleteRequest };