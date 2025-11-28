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
        INNER JOIN Users U ON CP.UserID = U.id
        ORDER BY CP.CreatedAt DESC
    `);
}

async function hasLiked(postId, userId) {
    const pool = await sql.connect(db);
    const result = await pool.request()
        .input("PostID", sql.Int, postId)
        .input("UserID", sql.Int, userId)
        .query(`
            SELECT 1 FROM CommunityLikes
            WHERE PostID = @PostID AND UserID = @UserID
        `);

    return result.recordset.length > 0;
}




async function likePost(postId, userId) {
    const pool = await sql.connect(db);
    await pool.request()
        .input("PostID", sql.Int, postId)
        .input("UserID", sql.Int, userId)
        .query(`
            INSERT INTO CommunityLikes(PostID, UserID)
            VALUES(@PostID, @UserID);

            UPDATE CommunityPosts
            SET LikeCount = LikeCount + 1
            WHERE PostID = @PostID;
        `);
}


async function unlikePost(postId, userId) {
    const pool = await sql.connect(db);
    await pool.request()
        .input("PostID", sql.Int, postId)
        .input("UserID", sql.Int, userId)
        .query(`
            DELETE FROM CommunityLikes
            WHERE PostID = @PostID AND UserID = @UserID;

            UPDATE CommunityPosts
            SET LikeCount = LikeCount - 1
            WHERE PostID = @PostID;
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
        SELECT 
            EventID, EventName, EventDate, 
            OrganizationID, Location, Description,
             RequiredVolunteers
        FROM Events 
        ORDER BY EventDate
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
        SELECT EventID, EventName, EventDate, OrganizationID,Location,RequiredVolunteers 
        FROM Events ORDER BY EventDate DESC
    `);

    const grouped = institutions.recordset.map(org => ({
        ...org,
        Events: events.recordset.filter(e => e.OrganizationID === org.OrganizationID)
    }));

    return grouped;
}

async function createComment(postId, userId, text) {
    const pool = await sql.connect(db);
    const result = await pool.request()
        .input("PostID", sql.Int, postId)
        .input("UserID", sql.Int, userId)
        .input("CommentText", sql.NVarChar(sql.MAX), text)
        .query(`
            INSERT INTO CommunityComments(PostID, UserID, CommentText)
            OUTPUT inserted.*
            VALUES(@PostID, @UserID, @CommentText)
        `);

    return result.recordset[0];
}


async function getCommentsForPost(postId) {
    const pool = await sql.connect(db);
    const result = await pool.request()
        .input("PostID", sql.Int, postId)
        .query(`
            SELECT C.*, U.name AS UserName
            FROM CommunityComments C
            INNER JOIN Users U ON U.id = C.UserID
            WHERE C.PostID = @PostID
            ORDER BY C.CreatedAt ASC
        `);
    return result.recordset;
}



module.exports = {
    createPost,
    getAllPosts,
    getAllInstitutions,
    getAllVolunteers,
    getInstitutionsWithEvents,
     likePost,
    unlikePost,
    hasLiked,
    createComment,
    getCommentsForPost,
};
