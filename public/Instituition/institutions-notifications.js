const API_BASE = 'https://fsdp-cycling-ltey.onrender.com';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '../../index.html';
}

const notificationsList = document.getElementById('notificationsList');
const btnMarkAllRead = document.getElementById('btnMarkAllRead');
const btnRefresh = document.getElementById('btnRefresh');

document.addEventListener('DOMContentLoaded', async () => {
  await loadNotifications();
  
  btnMarkAllRead.addEventListener('click', markAllAsRead);
  btnRefresh.addEventListener('click', loadNotifications);
  
  // Check for new notifications every 30 seconds
  setInterval(checkNewNotifications, 30000);
});

async function loadNotifications() {
  try {
    notificationsList.innerHTML = '<div class="loading-message">Loading notifications...</div>';
    
    const response = await fetch(`${API_BASE}/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load notifications (${response.status})`);
    }

    const notifications = await response.json();

    if (!Array.isArray(notifications) || notifications.length === 0) {
      notificationsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bell-slash"></i>
          <h3>No notifications</h3>
          <p>You're all caught up! New event notifications will appear here.</p>
        </div>
      `;
      return;
    }

    renderNotifications(notifications);
    updateNotificationBadge(notifications);

  } catch (error) {
    console.error('Error loading notifications:', error);
    notificationsList.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load notifications. Please try again later.</p>
      </div>
    `;
  }
}

function renderNotifications(notifications) {
  notificationsList.innerHTML = '';

  notifications.forEach(notification => {
    const item = document.createElement('div');
    item.className = `notification-item ${notification.readat ? 'read' : 'unread'}`;
    
    const timeAgo = formatTimeAgo(notification.createdat);
    const details = notification.payload || {};
    
    item.innerHTML = `
      <div class="notification-header">
        <h3 class="notification-title">${escapeHtml(notification.title || 'Notification')}</h3>
        <span class="notification-time">${timeAgo}</span>
      </div>
      <div class="notification-message">
        ${escapeHtml(notification.message || '')}
      </div>
      ${details.eventId || details.eventName ? `
        <div class="notification-details">
          <h4>Event Details</h4>
          ${details.eventName ? `<p><strong>Event:</strong> ${escapeHtml(details.eventName)}</p>` : ''}
          ${details.eventDate ? `<p><strong>Date:</strong> ${formatDate(details.eventDate)}</p>` : ''}
          ${details.eventLocation ? `<p><strong>Location:</strong> ${escapeHtml(details.eventLocation)}</p>` : ''}
        </div>
      ` : ''}
      ${!notification.readat ? `
        <div class="notification-actions">
          <button class="btn-mark-read" onclick="markAsRead(${notification.notificationid})">
            Mark as Read
          </button>
        </div>
      ` : ''}
    `;

    notificationsList.appendChild(item);
  });
}

async function markAsRead(notificationId) {
  try {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    // Reload notifications
    await loadNotifications();
    
    // Update badge
    await checkNewNotifications();
  } catch (error) {
    console.error('Error marking notification as read:', error);
    alert('Failed to mark notification as read. Please try again.');
  }
}

async function markAllAsRead() {
  try {
    const response = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }

    // Reload notifications
    await loadNotifications();
    
    // Update badge
    await checkNewNotifications();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    alert('Failed to mark all notifications as read. Please try again.');
  }
}

async function checkNewNotifications() {
  try {
    const response = await fetch(`${API_BASE}/notifications?unreadOnly=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const notifications = await response.json();
      updateNotificationBadge(notifications);
    }
  } catch (error) {
    console.error('Error checking new notifications:', error);
  }
}

function updateNotificationBadge(notifications) {
  const badge = document.getElementById('notificationBadge');
  if (!badge) return;
  
  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter(n => !n.readat).length 
    : 0;
  
  if (unreadCount > 0) {
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDate(dateString) {
  if (!dateString) return 'TBD';
  
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make markAsRead available globally for onclick handlers
window.markAsRead = markAsRead;
