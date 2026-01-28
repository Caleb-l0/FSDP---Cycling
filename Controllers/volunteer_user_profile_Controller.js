const userProfileModel = require("../Models/volunteer_user_profile_Model");


async function getPublicVolunteerProfile(req, res) {
  try {
    const userId = parseInt(req.params.id);

    const user = await userProfileModel.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const exp = await userProfileModel.getUserExperience(userId);
    const badges = await userProfileModel.getUserBadges(userId);
    const events = await userProfileModel.getUserEvents(userId);
    const followers = await userProfileModel.getFollowersCount(userId);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        level: user.level,
        joindate: user.joindate,
        role: user.role,
        email: user.email,
        phone: user.phone ?? user.phonenumber ?? null,
        advantages: user.advantages ?? null,
        profilePicture: user.profilepicture ?? null,

        total_events: exp.total_events,
        first_event_date: exp.first_event_date,

        followers,
        events,
        badges
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function searchVolunteers(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const q = String(req.query.q || '').trim();
    if (!q) return res.status(200).json([]);

    const results = await userProfileModel.searchVolunteers(q, userId, 10);
    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}


module.exports = {
  getPublicVolunteerProfile,
  searchVolunteers
};