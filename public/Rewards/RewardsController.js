const rewardsModel = require("../Rewards/RewardsModel.js");

getRewards = async (req, res) => {
    try {
        const rewards = await rewardsModel.getRewardsByUser(req.user.id);
        res.json(rewards);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to get rewards" });
    }
};


addReward = async (req, res) => {
    const { points, description } = req.body;

    if (!points) return res.status(400).json({ error: "Points required" });

    try {
        await rewardsModel.addReward(req.user.id, points, description);
        res.json({ message: "Reward added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add reward" });
    }
};

getTotalPoints = async (req, res) => {
    try {
        const total = await rewardsModel.getTotalPoints(req.user.id);
        res.json({ points: total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to get total points" });
    }
};

module.exports = { getRewards, addReward, getTotalPoints };
