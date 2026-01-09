const userProfileModel = require("../Models/volunteer_user_profile_Model");

async function getVolunteerProfile(req, res) {
  try {
    const requestedId = parseInt(req.params.id);
    const loggedInUserId = req.user.id; 

 
    if (requestedId !== loggedInUserId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const userInfo = await userProfileModel.getUserById(requestedId);
    const userExperience = await userProfileModel.getUserExperience(requestedId);
    const userEvents = await userProfileModel.getUserEvents(requestedId);
    const userBadge = await userProfileModel.getUserBadges(requestedId);

    res.status(200).json({
      userInfo,
      userExperience,
      userEvents,
      userBadge
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch user profile",
      error: error.message
    });
  }
}

module.exports = {
  getVolunteerProfile
};