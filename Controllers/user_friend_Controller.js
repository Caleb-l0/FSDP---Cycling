const { get } = require("../mailer");
const userFriendsModel = require("../Models/user_friend_Model");

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


const { sendMail } = require("../mailer");

async function sendFriendRequest(req, res) {
  try {
    const userId = req.user?.id;
    const friendId = Number(req.body.friendId);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!Number.isInteger(friendId)) return res.status(400).json({ message: "Invalid friendId" });


    const me = await pool.query(`SELECT id, name, email FROM users WHERE id=$1`, [userId]);
    if (me.rowCount === 0) return res.status(401).json({ message: "Unauthorized" });

    const result = await userFriendsModel.createFriendRequest(userId, friendId);

    if (!result.ok) {

      const status = (result.code === "ALREADY_FRIENDS") ? 409 : 400;
      return res.status(status).json(result);
    }

  
    if (!result.autoAccepted) {
      const friendEmail = result.friend.email;
      const friendName = result.friend.name || "there";
      const myName = me.rows[0].name || "Someone";

  
      await sendMail({
        to: friendEmail,
        subject: "You received a friend request",
        html: `
        <h1>From Cycling Without Age</h1>
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2>Hi ${friendName},</h2>
            <p><b>${myName}</b> sent you a friend request on <b>Happy Volunteer</b>.</p>
            <p>Open the app to accept or reject the request.</p>
            <p style="color:#666;font-size:12px">If you didn’t expect this, you can ignore this email.</p>
          </div>
        `
      });
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Send friend request error:", error);
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
    await userFriendsModel.removeFriend(userId, friendId);
    return res.status(200).json({ message: "Friend removed" });
  }
  catch (error) {
    console.error("Remove friend error:", error);
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



module.exports = {
  getMyFriends,
  addFriend,
  getFollowersCount,
  checkIfFriend,
  remobeFriend,
  getAllFriendsSignUpEvents,
  sendFriendRequest,
};