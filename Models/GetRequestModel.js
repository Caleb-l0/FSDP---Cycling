const sql = require("mssql");
const db = require("../dbconfig");


async function getAllRequests() {
    await sql.connect(db);
    const result = await sql.query`SELECT * FROM VolunteerRequests`;
    return result.recordset;

}


async function getRequestByOragnization(organizationId) {
    await sql.connect(db);
    const result = await sql.query`SELECT * FROM VolunteerRequests WHERE organizationId = ${organizationId}`;
    return result.recordset;
}



async function getRequestByApproved(status) {
    await sql.connect(db);
    const result = await sql.query`SELECT * FROM VolunteerRequests WHERE Status = 'Approved' `;
    return result.recordset;
}


async function getRequestByHistory(date) {
    await sql.connect(db);
    const result = await sql.query`SELECT * FROM VolunteerRequests WHERE EventDate < ${date} `;
    return result.recordset;

}

module.exports = { getAllRequests, getRequestByOragnization, getRequestByApproved,getRequestByHistory};

