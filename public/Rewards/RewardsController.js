const rewardsModel = require("../Rewards/RewardsModel");


async function getRewards(req, res) {
  try {
    const points = await rewardsModel.getUserPoints(req.user.id);
    const shopItems = await shopModel.getAllItems();
    res.json({ points, shopItems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load rewards" });
  }
}

async function redeem(req, res) {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;

    const item = await shopModel.getItemById(itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const points = await rewardsModel.getUserPoints(userId);
    if (points < item.Cost) return res.status(400).json({ error: "Not enough points" });

    await rewardsModel.redeemItem(userId, item);

    res.json({ message: `Redeemed ${item.Name}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Redemption failed" });
  }
}


module.exports = { getRewards, redeem };

