const NotificationModel = require("../Models/notification_model");

async function listMyNotifications(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const unreadOnly = String(req.query.unreadOnly ?? "false").toLowerCase() === "true";
    const limit = Number(req.query.limit ?? 50);

    const items = await NotificationModel.getUserNotifications(userId, { unreadOnly, limit });
    return res.status(200).json(items);
  } catch (err) {
    console.error("[notifications] list error:", err);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
}

async function markNotificationRead(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const updated = await NotificationModel.markRead(userId, req.params.id);
    if (!updated) return res.status(404).json({ message: "Notification not found" });

    return res.status(200).json(updated);
  } catch (err) {
    console.error("[notifications] mark read error:", err);
    return res.status(500).json({ message: "Failed to mark as read" });
  }
}

async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const rows = await NotificationModel.markAllRead(userId);
    return res.status(200).json({ updated: rows.length });
  } catch (err) {
    console.error("[notifications] mark all read error:", err);
    return res.status(500).json({ message: "Failed to mark all as read" });
  }
}

module.exports = {
  listMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
