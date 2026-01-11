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



module.exports = {
  getMyFriends,
  addFriend,
  getFollowersCount,
};