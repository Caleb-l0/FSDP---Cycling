const EmailModel = require('../Models/GetEmail_Model')
const pool = require("../Postgres_config");

// Get organization ID for the current user
async function getUserOrganizationID(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      console.error("getUserOrganizationID: req.user is undefined");
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = req.user.id;
    
    if (!userId) {
      console.error("getUserOrganizationID: userId is missing from req.user:", req.user);
      return res.status(400).json({ message: "User ID is missing" });
    }

    console.log("getUserOrganizationID: Querying for userId:", userId);

    // Check if pool is available
    if (!pool || typeof pool.query !== 'function') {
      console.error("getUserOrganizationID: Database pool is not available");
      return res.status(500).json({ message: "Database connection error" });
    }

    const result = await pool.query(
      `SELECT organizationid FROM userorganizations WHERE userid = $1 LIMIT 1`,
      [userId]
    );

    console.log("getUserOrganizationID: Query result rows:", result.rows.length);

    if (result.rows.length === 0) {
      // Return null instead of 404 - institution users might not have organization yet
      return res.status(200).json({ organizationId: null, message: "User is not associated with any organization" });
    }

    const organizationId = result.rows[0].organizationid;
    console.log("getUserOrganizationID: Found organizationId:", organizationId);
    res.status(200).json({ organizationId: organizationId });
  } catch (error) {
    console.error("getUserOrganizationID error:", error);
    console.error("Error details:", error.stack);
    console.error("Error message:", error.message);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function getOrganisationID(req,res){
try{
    const data = await EmailModel.getOrganisationID();
    res.json(data)
        
    
}
catch(error){
     res.status(500).json({ message: "Server error", error: error.message });
}
}


async function getMemberEmailsByOrganizationID(req,res){
     try {
        const { organizationID } = req.params;

        const data = await getMemberEmailsByOrganizationID(organizationID);

        res.json({
            organizationID,
            count: data.length,
            members: data
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
}

module.exports = {getMemberEmailsByOrganizationID, getOrganisationID, getUserOrganizationID}