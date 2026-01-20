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
};