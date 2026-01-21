const API_BASE = "https://fsdp-cycling-ltey.onrender.com";

const token = localStorage.getItem("token");
if (!token) {
  alert("Please log in to access notifications.");
  window.location.href = "../../index.html";
}

const listEl = document.getElementById("notiList");
const refreshBtn = document.getElementById("btnRefresh");

async function fetchIncoming() {
  const res = await fetch(`${API_BASE}/volunteer/friends/requests/incoming`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render(items) {
  if (!items || items.length === 0) {
    listEl.innerHTML = `<div class="noti-empty">No notifications yet.</div>`;
    return;
  }

  listEl.innerHTML = items.map(r => {
    const dateStr = r.requestdate ? new Date(r.requestdate).toLocaleString() : "";
    return `
      <div class="noti-item" data-request-id="${r.requestid}">
        <div class="noti-item-top">
          <div>
            <div class="noti-from">${escapeHtml(r.sendername || "Unknown")}</div>
            <div class="noti-meta">${escapeHtml(r.senderemail || "")} • ${escapeHtml(dateStr)}</div>
          </div>
        </div>
        ${r.requestreason ? `<div class="noti-reason"><b>Reason:</b> ${escapeHtml(r.requestreason)}</div>` : ""}
        <div class="noti-actions">
          <button class="noti-action noti-action--accept" type="button" data-action="accept">Accept</button>
          <button class="noti-action noti-action--reject" type="button" data-action="reject">Reject</button>
        </div>
      </div>
    `;
  }).join("");
}

async function acceptRequest(requestId) {
  const res = await fetch(`${API_BASE}/volunteer/friends/requests/${requestId}/accept`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to accept request");
}

async function rejectRequest(requestId) {
  const res = await fetch(`${API_BASE}/volunteer/friends/requests/${requestId}/reject`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to reject request");
}

async function load() {
  listEl.innerHTML = `<div class="noti-empty">Loading...</div>`;
  try {
    const items = await fetchIncoming();
    render(items);
  } catch (e) {
    console.error(e);
    listEl.innerHTML = `<div class="noti-empty">Unable to load notifications.</div>`;
  }
}

listEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const item = e.target.closest(".noti-item");
  const requestId = item?.dataset?.requestId;
  if (!requestId) return;

  btn.disabled = true;

  try {
    if (btn.dataset.action === "accept") {
      await acceptRequest(requestId);
    } else {
      const ok = confirm("Reject this friend request?");
      if (!ok) {
        btn.disabled = false;
        return;
      }
      await rejectRequest(requestId);
    }

    await load();
  } catch (err) {
    console.error(err);
    alert("Action failed. Please try again.");
    btn.disabled = false;
  }
});

refreshBtn?.addEventListener("click", load);

document.addEventListener("DOMContentLoaded", load);
