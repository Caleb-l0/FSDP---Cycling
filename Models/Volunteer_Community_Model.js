const sql = require("mssql");
const db = require("../dbconfig");

async function createPost(postData) {
    const pool = await sql.connect(db);
    const request = pool.request();

    request.input("UserID", sql.Int, postData.UserID);
    request.input("Content", sql.NVarChar(sql.MAX), postData.Content);
    request.input("PhotoURL", sql.NVarChar(255), postData.PhotoURL || null);
    request.input("Visibility", sql.VarChar(20), postData.Visibility || "public");
    request.input("TaggedInstitutionID", sql.Int, postData.TaggedInstitutionID || null);

    const result = await request.query(`
        INSERT INTO CommunityPosts
        (UserID, Content, PhotoURL, Visibility, TaggedInstitutionID)
        OUTPUT inserted.*
        VALUES
        (@UserID, @Content, @PhotoURL, @Visibility, @TaggedInstitutionID)
    `);

    return result.recordset[0];
}

async function getAllPosts() {
    const pool = await sql.connect(db);
    return pool.request().query(`
        SELECT CP.*, U.name AS UserName
        FROM CommunityPosts CP
        JOIN Users U ON CP.UserID = U.id
        ORDER BY CP.CreatedAt DESC
    `);
}



async function getAllInstitutions() {
    const pool = await sql.connect(db);

    const institutions = await pool.request().query(`
        SELECT OrganizationID, OrgName, OrgDescription
        FROM Organizations
        ORDER BY OrgName
    `);

    const events = await pool.request().query(`
        SELECT EventID, EventName, EventDate, OrganizationID
        FROM Events ORDER BY EventDate
    `);

    return { institutions: institutions.recordset, events: events.recordset };
}


async function getAllVolunteers() {
    const pool = await sql.connect(db);
    const result = await pool.request().query(`
        SELECT id, name FROM Users WHERE role='Volunteer' ORDER BY name
    `);
    return result.recordset;
}

async function getInstitutionsWithEvents() {
    const pool = await sql.connect(db);

    const institutions = await pool.request().query(`
        SELECT OrganizationID, OrgName, OrgDescription 
        FROM Organizations ORDER BY OrgName
    `);

    const events = await pool.request().query(`
        SELECT EventID, EventName, EventDate, OrganizationID
        FROM Events ORDER BY EventDate DESC
    `);

    const grouped = institutions.recordset.map(org => ({
        ...org,
        Events: events.recordset.filter(e => e.OrganizationID === org.OrganizationID)
    }));

    return grouped;
}


module.exports = {
    createPost,
    getAllPosts,
    
    getAllInstitutions,
    getAllPosts,
    getAllVolunteers,
    getInstitutionsWithEvents
};
