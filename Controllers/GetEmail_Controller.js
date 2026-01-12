const EmailModel = require('../Models/GetEmail_Model')
const pool = require("../Postgres_config");

// Get organization ID for the current user
async function getUserOrganizationID(req, res) {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is missing" });
    }

    const result = await pool.query(
      `SELECT organizationid FROM userorganizations WHERE userid = $1 LIMIT 1`,
      [userId]
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
    res.status(500).json({ message: "Server error", error: error.message });
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