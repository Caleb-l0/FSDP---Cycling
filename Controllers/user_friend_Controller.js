const userFriendsModel = require("../Models/userFriends_Model");

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

module.exports = {
  getMyFriends
};