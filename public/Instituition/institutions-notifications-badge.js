// Notification Badge Checker
// This script checks for unread notifications and displays a red dot badge

const API_BASE = 'https://fsdp-cycling-ltey.onrender.com';

async function checkNotificationBadge() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const badge = document.getElementById('notificationBadge');
  if (!badge) return;

  try {
    const response = await fetch(`${API_BASE}/notifications?unreadOnly=true&limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return;
    }

    const notifications = await response.json();
    const hasUnread = Array.isArray(notifications) && notifications.length > 0;

    if (hasUnread) {
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  } catch (error) {
    console.error('[Notification Badge] Error:', error);
    // Silently fail - don't show error to user
  }
}

// Check badge on page load
document.addEventListener('DOMContentLoaded', () => {
  checkNotificationBadge();
  
  // Check for new notifications every 30 seconds
  setInterval(checkNotificationBadge, 30000);
});
