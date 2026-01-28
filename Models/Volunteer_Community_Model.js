const pool = require("../Postgres_config");


// ===================================================
// 1. Create Post
// ===================================================
async function createPost(postData) {

  const result = await pool.query(
    `
      INSERT INTO communityposts
      (userid, content, photourl, visibility, taggedinstitutionid)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      postData.userid,
      postData.content,
      postData.photourl || null,
      postData.visibility || "public",
      postData.taggedinstitutionid || null
    ]
  );

  return result.rows[0];
}



// ===================================================
// 2. Get All Posts + Username
// ===================================================
async function getAllPosts() {
  const result = await pool.query(`
      SELECT 
        cp.postid,
        cp.userid,
        cp.content,
        cp.photourl,
        cp.likecount,
        cp.visibility,
        cp.taggedinstitutionid,
        cp.createdat,
        COALESCE(o.orgname, u.name) AS username
      FROM communityposts cp
      INNER JOIN users u ON cp.userid = u.id
      LEFT JOIN userorganizations uo
        ON uo.userid = u.id
      LEFT JOIN organizations o
        ON o.organizationid = uo.organizationid
       AND LOWER(TRIM(u.role)) = 'institution'
      ORDER BY cp.createdat DESC
  `);

  return result.rows;
}

async function getPostsForInstitution(organizationId, limit = 10) {
  const orgId = Number(organizationId);
  const lim = Math.max(1, Math.min(Number(limit) || 10, 25));
  if (!orgId) return [];

  const result = await pool.query(
    `
      SELECT
        cp.postid,
        cp.userid,
        cp.content,
        cp.photourl,
        cp.likecount,
        cp.visibility,
        cp.taggedinstitutionid,
        cp.createdat,
        COALESCE(o.orgname, u.name) AS username
      FROM communityposts cp
      INNER JOIN users u ON cp.userid = u.id
      LEFT JOIN userorganizations uo
        ON uo.userid = u.id
      LEFT JOIN organizations o
        ON o.organizationid = uo.organizationid
       AND LOWER(TRIM(u.role)) = 'institution'
      WHERE cp.taggedinstitutionid = $1
      ORDER BY cp.createdat DESC
      LIMIT $2
    `,
    [orgId, lim]
  );

  return result.rows;
}



// ===================================================
// 3. Check if user liked post
// ===================================================
async function hasLiked(postId, userId) {
  const result = await pool.query(
    `
      SELECT 1 
      FROM communitylikes
      WHERE postid = $1 AND userid = $2
    `,
    [postId, userId]
  );

  return result.rows.length > 0;
}



// ===================================================
// 4. Like Post (must run 2 queries)
// ===================================================
async function likePost(postId, userId) {

  await pool.query(
    `
      INSERT INTO communitylikes(postid, userid)
      VALUES ($1, $2)
    `,
    [postId, userId]
  );

  await pool.query(
    `
      UPDATE communityposts
      SET likecount = COALESCE(likecount, 0) + 1
      WHERE postid = $1
    `,
    [postId]
  );
}



// ===================================================
// 5. Unlike Post
// ===================================================
async function unlikePost(postId, userId) {

  await pool.query(
    `
      DELETE FROM communitylikes
      WHERE postid = $1 AND userid = $2
    `,
    [postId, userId]
  );

  await pool.query(
    `
      UPDATE communityposts
      SET likecount = COALESCE(likecount, 0) - 1
      WHERE postid = $1
    `,
    [postId]
  );
}



// ===================================================
// 6. Get All Institutions + All Events
// ===================================================
async function getAllInstitutions() {
  const institutions = await pool.query(`
      SELECT organizationid, orgname, orgdescription
      FROM organizations
      ORDER BY orgname
  `);

  const events = await pool.query(`
      SELECT 
        eventid, eventname, eventdate,
        organizationid, location, description,
        requiredvolunteers
      FROM events
      WHERE status = 'Upcoming'
        AND eventdate > NOW()
        AND organizationid IS NOT NULL
      ORDER BY eventdate
  `);

  return {
    institutions: institutions.rows,
    events: events.rows
  };
}



// ===================================================
// 7. Get All Volunteers
// ===================================================
async function getAllVolunteers() {
  const result = await pool.query(`
      SELECT id, name
      FROM users
      WHERE role = 'volunteer'
      ORDER BY name
  `);

  return result.rows;
}



// ===================================================
// 8. Institutions with their Events
// ===================================================
async function getInstitutionsWithEvents() {

  const institutions = await pool.query(`
      SELECT organizationid, orgname, orgdescription
      FROM organizations
      ORDER BY orgname
  `);

  const events = await pool.query(`
      SELECT eventid, eventname, eventdate, organizationid, location, requiredvolunteers
      FROM events
      ORDER BY eventdate DESC
  `);

  return institutions.rows.map(org => ({
    ...org,
    events: events.rows.filter(e => e.organizationid === org.organizationid)
  }));
}



// ===================================================
// 9. Create Comment
// ===================================================
async function createComment(postId, userId, text) {

  const result = await pool.query(
    `
      INSERT INTO communitycomments (postid, userid, commenttext)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [postId, userId, text]
  );

  return result.rows[0];
}



// ===================================================
// 10. Get All Comments for a Post
// ===================================================
async function getCommentsForPost(postId) {

  const result = await pool.query(
    `
      SELECT c.*, u.name AS username
      FROM communitycomments c
      INNER JOIN users u ON u.id = c.userid
      WHERE c.postid = $1
      ORDER BY c.createdat ASC
    `,
    [postId]
  );

  return result.rows;
}



module.exports = {
  createPost,
  getAllPosts,
  getPostsForInstitution,
  getAllInstitutions,
  getAllVolunteers,
  getInstitutionsWithEvents,
  likePost,
  unlikePost,
  hasLiked,
  createComment,
  getCommentsForPost
};
