const rewardsModel = require("../Models/reward_model");

// GET points + shop items
async function getRewards(req, res) {
    try {
        const userId = req.user.id;
        const points = await rewardsModel.getUserPoints(userId);
        const shopItems = await rewardsModel.getAllItems();

        res.json({ points, shopItems });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load rewards" });
    }
}

// Redeem an item
async function redeemItem(req, res) {
    try {
        const userId = req.user.id;
        const { itemId } = req.body;

        const item = await rewardsModel.getItemById(itemId);
        if (!item) return res.status(404).json({ error: "Item not found" });

        const points = await rewardsModel.getUserPoints(userId);
        if (points < item.Cost)
            return res.status(400).json({ error: "Not enough points" });

        await rewardsModel.redeemItem(userId, item);
        res.json({ message: `Redeemed ${item.Name}` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Redemption failed" });
    }
}

// Get redemption history
async function getHistory(req, res) {
    try {
        const userId = req.params.userId;
        const history = await rewardsModel.getHistory(userId);
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error loading history" });
    }
}


module.exports = {
    getRewards,
    redeemItem,
    getHistory
};
