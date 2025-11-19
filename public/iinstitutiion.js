//MVC for homepage_login_institution - Display events made by admin//

//Model//
const sql = require("mssql");
const db = require("../../dbconfig"); // your DB config

// Fetch all events associated with institutions
async function fetchInstitutionEvents() {
    try {
        await sql.connect(db);
        const result = await sql.query`
            SELECT e.EventID, e.EventName, e.EventDate, e.Description, e.RequiredVolunteers, e.EventLocation, o.OrgName
            FROM Events e
            INNER JOIN Organizations o ON e.OrganizationID = o.OrganizationID
            WHERE o.OrgName IS NOT NULL
            ORDER BY e.EventDate ASC
        `;
        return result.recordset;
    } catch (err) {
        console.error("Error fetching institution events:", err);
        throw err;
    }
}

module.exports = {
    fetchInstitutionEvents
};
//Controller//
const institutionModel = require("../Models/iinstitutionModel");

// Controller to get institution events
async function getInstitutionEvents(req, res) {
    try {
        const events = await institutionModel.fetchInstitutionEvents();
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch events", error: err.message });
    }
}

module.exports = {
    getInstitutionEvents
};


//Routes//
const express = require("express");
const router = express.Router();
const institutionController = require("../controllers/institutionController");

// Route to get all events for institution homepage
router.get("/events", institutionController.getInstitutionEvents);

module.exports = router;








