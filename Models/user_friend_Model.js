const pool = require("../Postgres_config");

/**
 * Get all friends of a user
 */
async function getUserFriends(userId, sortBy = "date") {
  let orderBy = "uf.adddate DESC";
  if (sortBy === "alpha") orderBy = "u.name ASC";

  const result = await pool.query(`
    SELECT
      u.id,
      u.name,
      u.level,
      u.joindate,
      uf.adddate,
      uf.friend_level,
      uf.nickname,
      uf.description
    FROM userfriends uf
    JOIN users u ON uf.friendid = u.id
    WHERE uf.userid = $1 AND uf.status = 'active'
    ORDER BY ${orderBy}
  `, [userId]);

  return result.rows;
}

async function addFriend(userId, friendId) {
  const result = await pool.query(`
    INSERT INTO userfriends (userid, friendid, status)
    VALUES ($1, $2, 'active')
    ON CONFLICT (userid, friendid)
    DO UPDATE SET status = 'active'
    RETURNING *
  `, [userId, friendId]);

  return result.rows[0];
}

async function getFollowersCount(userId) {
  const result = await pool.query(`
    SELECT COUNT(*)
    FROM userfriends
    WHERE friendid = $1 AND status = 'active'
  `, [userId]);

  return parseInt(result.rows[0].count);
}

async function removeFriend(userId, friendId) {
  const result = await pool.query(`
    UPDATE userfriends
    SET status = 'removed'
    WHERE userid = $1 AND friendid = $2
    RETURNING *
  `, [userId, friendId]);

  return result.rows[0];
}

async function isFriend(userId, friendId) {
  const result = await pool.query(`
    SELECT 1
    FROM userfriends
    WHERE userid = $1 AND friendid = $2 AND status = 'active'
  `, [userId, friendId]);

  return result.rows.length > 0;
}


async function getAllFriendsSignUpEvents(userId) {
  const result = await pool.query(`
    WITH friends AS (
      SELECT DISTINCT
        CASE 
          WHEN uf.userid = $1 THEN uf.friendid
          ELSE uf.userid
        END AS friend_id
      FROM userfriends uf
      WHERE (uf.userid = $1 OR uf.friendid = $1)
        AND uf.status = 'active'
    )
    SELECT
      f.friend_id,
      u.name AS friend_name,
      e.eventid,
      e.eventname,
      e.eventdate,
      e.location,
      e.eventimage,
      e.status AS event_status,
      es.signupdate AS signup_date,
      es.status AS signup_status
    FROM friends f
    JOIN users u ON u.id = f.friend_id
    JOIN eventsignups es ON es.userid = f.friend_id
    JOIN events e ON e.eventid = es.eventid
    ORDER BY u.name ASC, e.eventdate DESC, es.signupdate DESC
  `, [userId]);

  const map = new Map();
  for (const r of result.rows) {
    if (!map.has(r.friend_id)) {
      map.set(r.friend_id, {
        friendId: r.friend_id,
        friendName: r.friend_name,
        events: []
      });
    }
    map.get(r.friend_id).events.push({
      eventid: r.eventid,
      eventname: r.eventname,
      eventdate: r.eventdate,
      location: r.location,
      eventimage: r.eventimage,
      status: r.event_status,
      signup_date: r.signup_date,
      signup_status: r.signup_status
    });
  }

  return Array.from(map.values());
}

async function createFriendRequest(userId, friendId, requestReason = "") {
  if (userId === friendId) {
    return { ok: false, code: "SELF", message: "You cannot friend request yourself." };
  }


  const target = await pool.query(`SELECT id, name, email FROM users WHERE id = $1`, [friendId]);
  if (target.rowCount === 0) {
    return { ok: false, code: "NOT_FOUND", message: "User not found." };
  }


  const alreadyFriend = await pool.query(
    `SELECT 1 FROM userfriends 
     WHERE (userid=$1 AND friendid=$2 AND status='active')
        OR (userid=$2 AND friendid=$1 AND status='active')
     LIMIT 1`,
    [userId, friendId]
  );
  if (alreadyFriend.rowCount > 0) {
    return { ok: false, code: "ALREADY_FRIENDS", message: "You are already friends." };
  }

  const incoming = await pool.query(
    `SELECT requestid, status 
     FROM friendrequests
     WHERE userid=$2 AND friendid=$1 AND requesttype='friend'
     ORDER BY requestdate DESC
     LIMIT 1`,
    [userId, friendId]
  );

  if (incoming.rowCount > 0 && incoming.rows[0].status === "pending") {

    await pool.query("BEGIN");

    try {
      await pool.query(
        `UPDATE friendrequests 
         SET status='accepted'
         WHERE requestid=$1`,
        [incoming.rows[0].requestid]
      );

      await pool.query(
        `INSERT INTO userfriends (userid, friendid, status)
         VALUES ($1, $2, 'active')
         ON CONFLICT (userid, friendid) DO UPDATE SET status='active'`,
        [userId, friendId]
      );
      await pool.query(
        `INSERT INTO userfriends (userid, friendid, status)
         VALUES ($1, $2, 'active')
         ON CONFLICT (userid, friendid) DO UPDATE SET status='active'`,
        [friendId, userId]
      );

      await pool.query("COMMIT");

      return {
        ok: true,
        autoAccepted: true,
        friend: target.rows[0]
      };
    } catch (e) {
      await pool.query("ROLLBACK");
      throw e;
    }
  }

 
  const inserted = await pool.query(
    `INSERT INTO friendrequests (userid, friendid, requesttype, status, requestreason)
     VALUES ($1, $2, 'friend', 'pending', $3)
     ON CONFLICT (userid, friendid)
     DO UPDATE SET status='pending', requestdate=NOW(), requestreason=$3
     RETURNING requestid, userid, friendid, status, requestdate, requestreason`,
    [userId, friendId, requestReason]
  );

  return {
    ok: true,
    autoAccepted: false,
    request: inserted.rows[0],
    friend: target.rows[0]
  };
}

async function getIncomingFriendRequests(userId) {
  const result = await pool.query(
    `SELECT
      fr.requestid,
      fr.userid AS senderid,
      su.name AS sendername,
      su.email AS senderemail,
      fr.friendid AS receiverid,
      fr.status,
      fr.requestdate,
      fr.requestreason
    FROM friendrequests fr
    JOIN users su ON su.id = fr.userid
    WHERE fr.friendid = $1
      AND fr.requesttype = 'friend'
      AND fr.status = 'pending'
    ORDER BY fr.requestdate DESC`,
    [userId]
  );

  return result.rows;
}

async function getOutgoingFriendRequests(userId) {
  const result = await pool.query(
    `SELECT
      fr.requestid,
      fr.friendid AS targetid,
      tu.name AS targetname,
      tu.email AS targetemail,
      fr.status,
      fr.requestdate,
      fr.requestreason
    FROM friendrequests fr
    JOIN users tu ON tu.id = fr.friendid
    WHERE fr.userid = $1
      AND fr.requesttype = 'friend'
    ORDER BY fr.requestdate DESC`,
    [userId]
  );

  return result.rows;
}

async function getFriendRequestDetail(userId, requestId) {
  const result = await pool.query(
    `SELECT
      fr.requestid,
      fr.userid AS senderid,
      su.name AS sendername,
      su.email AS senderemail,
      fr.friendid AS receiverid,
      ru.name AS receivername,
      ru.email AS receiveremail,
      fr.status,
      fr.requestdate,
      fr.requestreason
    FROM friendrequests fr
    JOIN users su ON su.id = fr.userid
    JOIN users ru ON ru.id = fr.friendid
    WHERE fr.requestid = $1
      AND (fr.userid = $2 OR fr.friendid = $2)
      AND fr.requesttype = 'friend'`,
    [requestId, userId]
  );

  return result.rows[0] || null;
}

async function acceptFriendRequest(userId, requestId) {
  await pool.query("BEGIN");
  try {
    const reqRes = await pool.query(
      `SELECT requestid, userid, friendid, status
       FROM friendrequests
       WHERE requestid=$1 AND friendid=$2 AND requesttype='friend'
       FOR UPDATE`,
      [requestId, userId]
    );

    if (reqRes.rowCount === 0) {
      await pool.query("ROLLBACK");
      return { ok: false, code: "NOT_FOUND", message: "Request not found." };
    }

    const fr = reqRes.rows[0];
    if (fr.status !== "pending") {
      await pool.query("ROLLBACK");
      return { ok: false, code: "NOT_PENDING", message: "Request is not pending." };
    }

    await pool.query(
      `UPDATE friendrequests SET status='accepted' WHERE requestid=$1`,
      [requestId]
    );

    await pool.query(
      `INSERT INTO userfriends (userid, friendid, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (userid, friendid) DO UPDATE SET status='active'`,
      [fr.userid, fr.friendid]
    );

    await pool.query(
      `INSERT INTO userfriends (userid, friendid, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (userid, friendid) DO UPDATE SET status='active'`,
      [fr.friendid, fr.userid]
    );

    const meRes = await pool.query(`SELECT id, name, email FROM users WHERE id=$1`, [userId]);
    const friendRes = await pool.query(`SELECT id, name, email FROM users WHERE id=$1`, [fr.userid]);

    await pool.query("COMMIT");

    return {
      ok: true,
      requestId,
      me: meRes.rows[0],
      friend: friendRes.rows[0]
    };
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  }
}

async function rejectFriendRequest(userId, requestId) {
  const reqRes = await pool.query(
    `SELECT requestid, userid, friendid, status
     FROM friendrequests
     WHERE requestid=$1 AND friendid=$2 AND requesttype='friend'`,
    [requestId, userId]
  );

  if (reqRes.rowCount === 0) {
    return { ok: false, code: "NOT_FOUND", message: "Request not found." };
  }

  const fr = reqRes.rows[0];
  if (fr.status !== "pending") {
    return { ok: false, code: "NOT_PENDING", message: "Request is not pending." };
  }

  await pool.query(
    `UPDATE friendrequests SET status='rejected' WHERE requestid=$1`,
    [requestId]
  );

  const meRes = await pool.query(`SELECT id, name, email FROM users WHERE id=$1`, [userId]);
  const friendRes = await pool.query(`SELECT id, name, email FROM users WHERE id=$1`, [fr.userid]);

  return {
    ok: true,
    requestId,
    me: meRes.rows[0],
    friend: friendRes.rows[0]
  };
}

async function getFriendStatus(userId, otherId) {
  const active = await pool.query(
    `SELECT 1 FROM userfriends WHERE userid=$1 AND friendid=$2 AND status='active' LIMIT 1`,
    [userId, otherId]
  );
  if (active.rowCount > 0) return { status: "friends" };

  const outgoing = await pool.query(
    `SELECT requestid, status
     FROM friendrequests
     WHERE userid=$1 AND friendid=$2 AND requesttype='friend'
     ORDER BY requestdate DESC LIMIT 1`,
    [userId, otherId]
  );
  if (outgoing.rowCount > 0 && outgoing.rows[0].status === "pending") {
    return { status: "pending_outgoing", requestId: outgoing.rows[0].requestid };
  }

  const incoming = await pool.query(
    `SELECT requestid, status
     FROM friendrequests
     WHERE userid=$2 AND friendid=$1 AND requesttype='friend'
     ORDER BY requestdate DESC LIMIT 1`,
    [userId, otherId]
  );
  if (incoming.rowCount > 0 && incoming.rows[0].status === "pending") {
    return { status: "pending_incoming", requestId: incoming.rows[0].requestid };
  }

  return { status: "none" };
}




module.exports = {
  getUserFriends,
  addFriend,
  removeFriend,
  getFollowersCount,
  isFriend,
  getAllFriendsSignUpEvents,
  createFriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  getFriendRequestDetail,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendStatus,
};
