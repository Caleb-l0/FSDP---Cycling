const sql = require("mssql");
const db = require("../dbconfig");

async function getOrganisationID(){
    try {
        const pool = await sql.connect(db);

        const result = await pool.request()
           
            .query(`
                SELECT OrganizationID FROM Organizations;
            `);

        return result.recordset;  
        
    } catch (err) {
        console.error("Error fetching organ id:", err);
        throw err;
    }
}


async function getMemberEmailsByOrganizationID(organizationID) {
    try {
        const pool = await sql.connect(db);

        const result = await pool.request()
            .input("OrganizationID", sql.Int, organizationID)
            .query(`
                SELECT u.id, u.email
                FROM UserOrganizations uo
                JOIN Users u ON uo.UserID = u.id
                WHERE uo.OrganizationID = @OrganizationID
            `);

        return result.recordset;  
        
    } catch (err) {
        console.error("Error fetching member emails:", err);
        throw err;
    }
}


module.export = {
    getOrganisationID,
  getMemberEmailsByOrganizationID,
}