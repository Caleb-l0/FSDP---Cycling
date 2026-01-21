const userFriendsModel = require("../Models/user_friend_Model");
const pool = require("../Postgres_config");
const transporter = require("../mailer");

/**
 * Get my friends list (private)
 */
async function getMyFriends(req, res) {
  try {
    const userId = req.user.id;
    const sortBy = req.query.sort || "date"; // date | alpha

    const friends = await userFriendsModel.getUserFriends(userId, sortBy);

    return res.status(200).json(friends);
  } catch (error) {
    console.error("Get friends error:", error);
    return res.status(500).json({
      message: "Failed to fetch friends"
    });
  }
}

async function sendFriendRequest(req, res) {
  try {
    const userId = req.user?.id;
    const friendId = Number(req.body.friendId);
    const requestReason = (req.body.requestReason ?? req.body.reason ?? "").toString().trim();

    console.log("[sendFriendRequest] userId:", userId, "friendId:", friendId, "reason:", requestReason);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!Number.isInteger(friendId) || friendId <= 0) return res.status(400).json({ message: "Invalid friendId" });

    const me = await pool.query(`SELECT id, name, email FROM users WHERE id=$1`, [userId]);
    if (me.rowCount === 0) return res.status(401).json({ message: "Unauthorized" });

    const result = await userFriendsModel.createFriendRequest(userId, friendId, requestReason);
    console.log("[sendFriendRequest] createFriendRequest result:", JSON.stringify(result));

    if (!result.ok) {
      const status = (result.code === "ALREADY_FRIENDS") ? 409 : 400;
      return res.status(status).json(result);
    }

    res.status(201).json(result);

    if (!result.autoAccepted) {
      const friendEmail = result.friend.email;
      const friendName = result.friend.name || "there";
      const myName = me.rows[0].name || "Someone";

      const reasonBlock = requestReason
        ? `<p><b>Reason:</b> ${escapeHtml(requestReason)}</p>`
        : "";

      setImmediate(async () => {
        try {
          await transporter.sendMail({
            to: friendEmail,
            subject: "You received a friend request",
            html: `
            <h1>From Cycling Without Age</h1>
              <div style="font-family:Arial,sans-serif;line-height:1.6">
                <h2>Hi ${friendName},</h2>
                <p><b>${myName}</b> sent you a friend request on <b>Happy Volunteer</b>.</p>
                ${reasonBlock}
                <p>Open the app to accept or reject the request.</p>
                <p style="color:#666;font-size:12px">If you didn't expect this, you can ignore this email.</p>
              </div>
            `
          });
          console.log("[sendFriendRequest] Email sent to:", friendEmail);
        } catch (emailErr) {
          console.error("[sendFriendRequest] Failed to send email:", emailErr);
        }
      });
    }

    return;
  } catch (error) {
    console.error("[sendFriendRequest] Error:", error);
    return res.status(500).json({ message: "Failed to send friend request" });
  }
}

async function addFriend(req, res) {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;
    const newFriend = await userFriendsModel.addFriend(userId, friendId);
    return res.status(201).json(newFriend);
  }
  catch (error) {
    console.error("Add friend error:", error);
    return res.status(500).json({
      message: "Failed to add friend"
    });
  }

}

async function remobeFriend(req, res) {
  try {
    const userId = req.user.id;
    const friendId = parseInt(req.params.friendId);

    console.log("[removeFriend] userId:", userId, "friendId:", friendId);

    const removeReason = (req.body?.removeReason ?? req.body?.reason ?? req.query?.reason ?? "").toString().trim();

    const me = await pool.query(`SELECT id, name, email FROM users WHERE id=$1`, [userId]);
    const friend = await pool.query(`SELECT id, name, email FROM users WHERE id=$1`, [friendId]);
    if (me.rowCount === 0) return res.status(401).json({ message: "Unauthorized" });
    if (friend.rowCount === 0) return res.status(404).json({ message: "User not found" });

    await userFriendsModel.removeFriend(userId, friendId);
    console.log("[removeFriend] Friend removed from DB");

    // Send response FIRST
    res.status(200).json({ message: "Friend removed successfully" });

    // Then send email in background
    const friendEmail = friend.rows[0].email;
    const friendName = friend.rows[0].name || "there";
    const myName = me.rows[0].name || "Someone";

    const reasonBlock = removeReason
      ? `<p><b>Reason:</b> ${escapeHtml(removeReason)}</p>`
      : "";

    setImmediate(async () => {
      try {
        await transporter.sendMail({
          to: friendEmail,
          subject: "Friend removed",
          html: `
          <h1>From Cycling Without Age</h1>
            <div style="font-family:Arial,sans-serif;line-height:1.6">
              <h2>Hi ${friendName},</h2>
              <p><b>${myName}</b> removed you from their friends list on <b>Happy Volunteer</b>.</p>
              ${reasonBlock}
              <p style="color:#666;font-size:12px">If you think this was a mistake, you can reach out or send a new friend request.</p>
            </div>
          `
        });
        console.log("[removeFriend] Email sent to:", friendEmail);
      } catch (emailErr) {
        console.error("[removeFriend] Failed to send email:", emailErr);
      }
    });

    return;
  }
  catch (error) {
    console.error("[removeFriend] Error:", error);
    return res.status(500).json({
      message: "Failed to remove friend"
    });
  }
}

async function getFollowersCount(req, res) {
  try {
    const userId = req.user.id; 
    const count = await userFriendsModel.getFollowersCount(userId);
    return res.status(200).json({ followersCount: count });
  }
  catch (error) {
    console.error("Get followers count error:", error);
    return res.status(500).json({

      message: "Failed to get followers count"
    });
  } 
}

async function checkIfFriend(req, res) {
  try {
    const userId = req.user.id;
    const friendId = parseInt(req.params.friendId);
    const isFriend = await userFriendsModel.isFriend(userId, friendId);
    return res.status(200).json({ isFriend });
  }
  catch (error) {
    console.error("Check friend error:", error);
    return res.status(500).json({
      message: "Failed to check friendship status"
    });
  }
}

async function getAllFriendsSignUpEvents(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const data = await userFriendsModel.getAllFriendsSignUpEvents(userId);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Get all friends sign-up events error:", error);
    return res.status(500).json({ message: "Failed to get friends sign-up events" });
  }
}

async function getIncomingFriendRequests(req, res) {
  try {
    const userId = req.user.id;
    const requests = await userFriendsModel.getIncomingFriendRequests(userId);
    return res.status(200).json(requests);
  } catch (error) {
    console.error("Get incoming friend requests error:", error);
    return res.status(500).json({ message: "Failed to get incoming friend requests" });
  }
}

async function getOutgoingFriendRequests(req, res) {
  try {
    const userId = req.user.id;
    const requests = await userFriendsModel.getOutgoingFriendRequests(userId);
    return res.status(200).json(requests);
  } catch (error) {
    console.error("Get outgoing friend requests error:", error);
    return res.status(500).json({ message: "Failed to get outgoing friend requests" });
  }
}

async function getFriendRequestDetail(req, res) {
  try {
    const userId = req.user.id;
    const requestId = parseInt(req.params.requestId);
    const request = await userFriendsModel.getFriendRequestDetail(userId, requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    return res.status(200).json(request);
  } catch (error) {
    console.error("Get friend request detail error:", error);
    return res.status(500).json({ message: "Failed to get friend request detail" });
  }
}

async function acceptFriendRequest(req, res) {
  try {
    const userId = req.user.id;
    const requestId = parseInt(req.params.requestId);
    const result = await userFriendsModel.acceptFriendRequest(userId, requestId);
    if (!result.ok) {
      return res.status(400).json(result);
    }

    // Send response FIRST
    res.status(200).json(result);

    // Then send email in background
    const friendEmail = result.friend.email;
    const friendName = result.friend.name || "there";
    const myName = result.me.name || "Someone";

    setImmediate(async () => {
      try {
        await transporter.sendMail({
          to: friendEmail,
          subject: "Friend request accepted",
          html: `
          <h1>From Cycling Without Age</h1>
            <div style="font-family:Arial,sans-serif;line-height:1.6">
              <h2>Hi ${friendName},</h2>
              <p><b>${myName}</b> accepted your friend request on <b>Happy Volunteer</b>.</p>
              <p>You are now friends!</p>
              <p style="color:#666;font-size:12px">If you didn't expect this, you can ignore this email.</p>
            </div>
          `
        });
        console.log("[acceptFriendRequest] Email sent to:", friendEmail);
      } catch (emailErr) {
        console.error("[acceptFriendRequest] Failed to send email:", emailErr);
      }
    });

    return;
  } catch (error) {
    console.error("Accept friend request error:", error);
    return res.status(500).json({ message: "Failed to accept friend request" });
  }
}

async function rejectFriendRequest(req, res) {
  try {
    const userId = req.user.id;
    const requestId = parseInt(req.params.requestId);
    const result = await userFriendsModel.rejectFriendRequest(userId, requestId);
    if (!result.ok) {
      return res.status(400).json(result);
    }

    // Send response FIRST
    res.status(200).json(result);

    // Then send email in background
    const friendEmail = result.friend.email;
    const friendName = result.friend.name || "there";
    const myName = result.me.name || "Someone";

    setImmediate(async () => {
      try {
        await transporter.sendMail({
          to: friendEmail,
          subject: "Friend request rejected",
          html: `
          <h1>From Cycling Without Age</h1>
            <div style="font-family:Arial,sans-serif;line-height:1.6">
              <h2>Hi ${friendName},</h2>
              <p><b>${myName}</b> rejected your friend request on <b>Happy Volunteer</b>.</p>
              <p>You can try sending another request if you want.</p>
              <p style="color:#666;font-size:12px">If you didn’t expect this, you can ignore this email.</p>
            </div>
          `
        });
        console.log("[rejectFriendRequest] Email sent to:", friendEmail);
      } catch (emailErr) {
        console.error("[rejectFriendRequest] Failed to send email:", emailErr);
      }
    });

    return;
  } catch (error) {
    console.error("Reject friend request error:", error);
    return res.status(500).json({ message: "Failed to reject friend request" });
  }
}

async function getFriendStatus(req, res) {
  try {
    const userId = req.user.id;
    const friendId = parseInt(req.params.friendId);
    const status = await userFriendsModel.getFriendStatus(userId, friendId);
    return res.status(200).json(status);
  } catch (error) {
    console.error("Get friend status error:", error);
    return res.status(500).json({ message: "Failed to get friend status" });
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

module.exports = {
  getMyFriends,
  addFriend,
  getFollowersCount,
  checkIfFriend,
  remobeFriend,
  getAllFriendsSignUpEvents,
  sendFriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  getFriendRequestDetail,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendStatus,
};