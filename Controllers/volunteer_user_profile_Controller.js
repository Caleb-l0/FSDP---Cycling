const userProfileModel = require("../Models/volunteer_user_profile_Model");

async function getPublicVolunteerProfile(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);

    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const userInfo = await userProfileModel.getUserById(userId);
    if (!userInfo) {
      return res.status(404).json({ message: "User not found" });
    }

    const userExperience = await userProfileModel.getUserExperience(userId);
    const userBadge = await userProfileModel.getUserBadges(userId);

    return res.status(200).json({
      id: userInfo.id,
      name: userInfo.name,
      level: userInfo.level,
      total_events: userExperience?.total_events ?? 0,
      badges: userBadge.map(b => ({
        badgename: b.badgename,
        iconurl: b.iconurl
      }))
    });

  } catch (error) {
    console.error("Public profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getVolunteerProfile
};