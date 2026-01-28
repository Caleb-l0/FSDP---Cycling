const token = localStorage.getItem("token");
const DEFAULT_AVATAR = "../Volunteer/default_user.png";
const DEFAULT_ORG = "../Volunteer/default_org.jpg";

if (!token) {
  window.location.href = "../../index.html";
}

// --- Create Post: open / close ---
function openPostForm() {
  const form = document.getElementById("postForm");
  const overlay = document.getElementById("postFormOverlay");
  if (form) form.classList.add("is-open");
  if (overlay) {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
  }
}

function closePostForm() {
  const form = document.getElementById("postForm");
  const overlay = document.getElementById("postFormOverlay");
  if (form) form.classList.remove("is-open");
  if (overlay) {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }
}

document.getElementById("openPostFormDesktop")?.addEventListener("click", openPostForm);
document.getElementById("closePostForm")?.addEventListener("click", closePostForm);
document.getElementById("postFormOverlay")?.addEventListener("click", closePostForm);
document.getElementById("postSubmitBtn")?.addEventListener("click", submitPost);

// --- Submit Post (no Tag Institution for institution) ---
async function submitPost() {
  const contentEl = document.getElementById("postContent");
  const visibilityEl = document.getElementById("postVisibility");
  const content = (contentEl?.value || "").trim();
  const visibility = visibilityEl?.value || "public";

  if (!content) {
    alert("Please write something before posting.");
    return;
  }

  const body = { content, visibility, taggedinstitutionid: null };

  try {
    const res = await fetch("https://fsdp-cycling-ltey.onrender.com/community/posts", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Failed to create post");
      return;
    }
    alert(data.message || "Post created");
    if (contentEl) contentEl.value = "";
    closePostForm();
    loadPosts();
  } catch (e) {
    console.error(e);
    alert("Failed to create post. Please try again.");
  }
}

// --- Loading ---
function ensureLoadingOverlay() {
  if (document.getElementById("hvLoading")) return;
  const wrap = document.createElement("div");
  wrap.id = "hvLoading";
  wrap.className = "hv-loading";
  wrap.innerHTML = `
    <div class="hv-loading__backdrop"></div>
    <div class="hv-loading__card" role="status" aria-live="polite">
      <div class="hv-loading__spinner" aria-hidden="true"></div>
      <h3 class="hv-loading__title">Loading Community</h3>
      <div class="hv-loading__sub">Please wait…</div>
    </div>
  `;
  document.body.appendChild(wrap);
}

let hvLoadingCount = 0;
function showLoading() {
  ensureLoadingOverlay();
  hvLoadingCount += 1;
  document.getElementById("hvLoading")?.classList.add("is-open");
}

function hideLoading() {
  hvLoadingCount = Math.max(0, hvLoadingCount - 1);
  if (hvLoadingCount === 0) document.getElementById("hvLoading")?.classList.remove("is-open");
}

// --- Congrats (optional, for comments) ---
function ensureCongratsOverlay() {
  if (document.getElementById("hvCongrats")) return;
  const wrap = document.createElement("div");
  wrap.id = "hvCongrats";
  wrap.className = "hv-congrats";
  wrap.innerHTML = `
    <div class="hv-congrats__backdrop" data-close="true"></div>
    <div class="hv-congrats__dialog" role="dialog" aria-modal="true" aria-label="Congratulations">
      <div class="hv-confetti" aria-hidden="true"></div>
      <div class="hv-congrats__body">
        <div class="hv-congrats__icon" aria-hidden="true">✓</div>
        <h3 class="hv-congrats__title">Congratulations!</h3>
        <p class="hv-congrats__msg" id="hvCongratsMsg"></p>
      </div>
      <div class="hv-congrats__footer">
        <button class="hv-congrats__btn" type="button" id="hvCongratsOk">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  const close = () => wrap.classList.remove("is-open");
  wrap.addEventListener("click", (e) => { if (e.target?.dataset?.close === "true") close(); });
  wrap.querySelector("#hvCongratsOk")?.addEventListener("click", close);
}

function launchConfetti(container) {
  if (!container) return;
  container.innerHTML = "";
  const colors = ["#ea8d2a", "#16a34a", "#2563eb", "#dc2626", "#0f172a", "#f59e0b"];
  for (let i = 0; i < 28; i++) {
    const el = document.createElement("i");
    el.style.left = Math.random() * 100 + "%";
    el.style.background = colors[i % colors.length];
    el.style.width = (8 + Math.random() * 8) + "px";
    el.style.height = (10 + Math.random() * 12) + "px";
    el.style.animationDelay = Math.random() * 120 + "ms";
    el.style.animationDuration = (700 + Math.random() * 600) + "ms";
    container.appendChild(el);
  }
}

function showCongrats(msg) {
  ensureCongratsOverlay();
  const wrap = document.getElementById("hvCongrats");
  const m = wrap?.querySelector("#hvCongratsMsg");
  if (m) m.textContent = msg || "";
  launchConfetti(wrap?.querySelector(".hv-confetti"));
  wrap?.classList.add("is-open");
  if (wrap._t) clearTimeout(wrap._t);
  wrap._t = setTimeout(() => wrap?.classList.remove("is-open"), 2200);
}

// --- Dismiss post ---
function dismissPost(card) {
  if (!card) return;
  card.classList.add("is-dismissed");
  setTimeout(() => card.remove(), 260);
}

document.addEventListener("click", (e) => {
  const btn = e.target?.closest?.(".post-collapse-btn");
  if (btn) dismissPost(btn.closest(".post-card"));
});

// --- Load Posts ---
async function loadPosts() {
  showLoading();
  try {
    const res = await fetch("https://fsdp-cycling-ltey.onrender.com/community/browse/posts", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const posts = await res.json();
    const container = document.querySelector(".feed-list");
    if (!container) return;
    container.innerHTML = "";

    (Array.isArray(posts) ? posts : []).forEach((p) => {
      const avatarUrl = p.profilepicture || DEFAULT_AVATAR;
      container.innerHTML += `
        <div class="post-card" data-post-id="${p.postid}">
          <div class="post-header">
            <img class="post-avatar" src="${avatarUrl}" alt="${(p.username || "").replace(/</g, "&lt;")}'s avatar">
            <div>
              <h4 class="post-user">${(p.username || "").replace(/</g, "&lt;")}</h4>
              <p class="post-time">${new Date(p.createdat).toLocaleString()}</p>
            </div>
            <div class="post-header-actions">
              <button class="post-collapse-btn" type="button" aria-label="Hide this post">× Hide</button>
            </div>
          </div>
          <div class="post-body">
            <p class="post-text">${(p.content || "").replace(/</g, "&lt;")}</p>
            ${p.photourl ? `<img class="post-img" src="${p.photourl}" alt="">` : ""}
            <div class="post-actions">
              <button class="btn-like"><i class="fa-solid fa-heart"></i> Like</button>
              <div class="like-display">People Like: <span class="like-count">${p.likecount ?? 0}</span></div>
              <button class="btn-open-comments"><i class="fa-solid fa-comment"></i> Comment</button>
            </div>
            <div class="post-comments"></div>
          </div>
        </div>
      `;
    });
    attachLikeEvents();
    attachCommentEvents();
  } finally {
    hideLoading();
  }
}

function attachLikeEvents() {
  document.querySelectorAll(".post-card").forEach((card) => {
    const likeBtn = card.querySelector(".btn-like");
    const likeCountEl = card.querySelector(".like-count");
    const postId = card.getAttribute("data-post-id");
    if (!likeBtn || !likeCountEl || !postId) return;
    likeBtn.addEventListener("click", async () => {
      try {
        const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/community/posts/${postId}/like`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) { alert(data.message || "Failed to like"); return; }
        let c = parseInt(likeCountEl.textContent, 10) || 0;
        if (data.liked) { likeCountEl.textContent = c + 1; likeBtn.classList.add("liked"); }
        else { likeCountEl.textContent = Math.max(c - 1, 0); likeBtn.classList.remove("liked"); }
      } catch (e) { alert("Failed to like"); }
    });
  });
}

let currentPostId = null;

function attachCommentEvents() {
  document.querySelectorAll(".post-card").forEach((card) => {
    const postId = card.getAttribute("data-post-id");
    const openBtn = card.querySelector(".btn-open-comments") || card.querySelector(".btn-comment");
    const list = card.querySelector(".post-comments");
    if (openBtn) {
      openBtn.addEventListener("click", () => {
        currentPostId = postId;
        document.getElementById("globalCommentPanel")?.classList.add("show");
        document.getElementById("globalCommentOverlay").style.display = "block";
        document.body.style.overflow = "hidden";
        const inp = document.getElementById("globalCommentInput");
        if (inp) inp.value = "";
      });
    }
    loadComments(postId, list);
  });
}

document.addEventListener("click", (e) => {
  const btn = e.target?.closest?.(".btn-open-comments, .btn-comment");
  if (!btn) return;
  const card = btn.closest(".post-card");
  const pid = card?.getAttribute?.("data-post-id");
  if (pid) {
    currentPostId = pid;
    document.getElementById("globalCommentPanel")?.classList.add("show");
    document.getElementById("globalCommentOverlay").style.display = "block";
    document.body.style.overflow = "hidden";
    const inp = document.getElementById("globalCommentInput");
    if (inp) inp.value = "";
  }
});

function closeCommentBox() {
  document.getElementById("globalCommentPanel")?.classList.remove("show");
  const ov = document.getElementById("globalCommentOverlay");
  if (ov) ov.style.display = "none";
  document.body.style.overflow = "";
}

document.getElementById("closeGlobalComment")?.addEventListener("click", closeCommentBox);
document.getElementById("globalCommentOverlay")?.addEventListener("click", closeCommentBox);

document.getElementById("globalCommentSend")?.addEventListener("click", async () => {
  const inp = document.getElementById("globalCommentInput");
  const text = (inp?.value || "").trim();
  if (!text || !currentPostId) return;
  try {
    const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/community/posts/${currentPostId}/comments`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ CommentText: text })
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d?.message || "Failed to post comment");
      return;
    }
    closeCommentBox();
    showCongrats("Comment posted successfully!");
    const postCard = document.querySelector(`.post-card[data-post-id="${currentPostId}"]`);
    loadComments(currentPostId, postCard?.querySelector(".post-comments"));
  } catch (e) {
    alert("Failed to post comment");
  }
});

async function loadComments(postId, container) {
  if (!container) return;
  try {
    const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/community/posts/${postId}/comments`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) { container.innerHTML = ""; return; }
    const comments = await res.json();
    container.innerHTML = "";
    if (!Array.isArray(comments)) return;
    comments.forEach((c) => {
      const avatarUrl = c.profilepicture || DEFAULT_AVATAR;
      container.innerHTML += `
        <div class="comment-item">
          <img class="comment-avatar" src="${avatarUrl}" alt="${(c.username || "").replace(/</g, "&lt;")}'s avatar">
          <div class="comment-content">
            <strong>${(c.username || "").replace(/</g, "&lt;")}:</strong>
            <span>${(c.commenttext || "").replace(/</g, "&lt;")}</span>
            <div class="comment-time">${new Date(c.createdat).toLocaleString()}</div>
          </div>
        </div>
      `;
    });
  } catch (e) {
    container.innerHTML = "";
  }
}

// --- Volunteers ---
async function loadVolunteers() {
  showLoading();
  try {
    const res = await fetch("https://fsdp-cycling-ltey.onrender.com/community/browse/volunteers", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const list = await res.json();
    const container = document.querySelector(".people-scroll");
    if (!container) return;
    container.innerHTML = "";
    (Array.isArray(list) ? list : []).forEach((v) => {
      container.innerHTML += `
        <div class="people-card">
          <img src="${v.profilepicture || DEFAULT_AVATAR}" class="people-avatar" alt="${(v.name || "").replace(/</g, "&lt;")}'s avatar">
          <h4 class="people-name">${(v.name || "").replace(/</g, "&lt;")}</h4>
          <button class="btn-add">Add Friend</button>
        </div>
      `;
    });
  } finally {
    hideLoading();
  }
}

// --- Other Institutions ---
async function loadInstitutions() {
  showLoading();
  try {
    const res = await fetch("https://fsdp-cycling-ltey.onrender.com/community/browse/institutions", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    const tabs = document.getElementById("instiTabs");
    const panels = document.getElementById("instiPanelsContainer");
    if (!tabs || !panels) return;
    tabs.innerHTML = "";
    panels.innerHTML = "";

    (Array.isArray(data) ? data : []).forEach((org, i) => {
      tabs.innerHTML += `
        <button class="insti-btn ${i === 0 ? "active" : ""}" data-target="inst_${org.organizationid}">${(org.orgname || "").replace(/</g, "&lt;")}</button>
      `;
      const events = org.events || [];
      panels.innerHTML += `
        <div id="inst_${org.organizationid}" class="insti-panel ${i === 0 ? "active" : ""}">
          <div class="insti-overview active">
            <div class="insti-banner">
              <img src="${DEFAULT_ORG}" class="insti-banner-img" alt="">
              <div class="insti-banner-overlay"><h3>${(org.orgname || "").replace(/</g, "&lt;")}</h3></div>
            </div>
            <div class="insti-description"><p>${(org.orgdescription || "").replace(/</g, "&lt;")}</p></div>
            <div class="insti-stats"><div class="stat-box"><span>${events.length}</span><label>Events</label></div></div>
            <button class="insti-view-events-btn" onclick="openInstitutionEvents('${org.organizationid}')">View Events →</button>
          </div>
          <div class="insti-events-screen">
            <button class="back-btn" onclick="goBackToInstitution('${org.organizationid}')">← Back</button>
            <h3 class="events-title">${(org.orgname || "").replace(/</g, "&lt;")} – Events</h3>
            <div class="insti-events-list">
              ${events.length === 0 ? '<p class="no-events">No events available</p>' : events.map((e) => `
                <div class="event-card" onclick="openEventDetail(${e.eventid})">
                  <h4>${(e.eventname || "").replace(/</g, "&lt;")}</h4>
                  <p>${new Date(e.eventdate).toLocaleDateString()}</p>
                  <p>${(e.location || "").replace(/</g, "&lt;")}</p>
                  <p>Volunteers needed: ${e.requiredvolunteers ?? 0}</p>
                  <button class="btn">View</button>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `;
    });
    attachInstitutionTabEvents();
  } finally {
    hideLoading();
  }
}

function openEventDetail(eventId) {
  window.location.href = `../Volunteer/volunteer_event_detail.html?eventId=${eventId}`;
}

function attachInstitutionTabEvents() {
  document.querySelectorAll(".insti-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".insti-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".insti-panel").forEach((p) => p.classList.remove("active"));
      const t = document.getElementById(btn.getAttribute("data-target"));
      if (t) t.classList.add("active");
    });
  });
}

function openInstitutionEvents(id) {
  const panel = document.getElementById("inst_" + id);
  if (panel) {
    panel.querySelector(".insti-overview")?.classList.remove("active");
    panel.querySelector(".insti-events-screen")?.classList.add("active");
  }
}

function goBackToInstitution(id) {
  const panel = document.getElementById("inst_" + id);
  if (panel) {
    panel.querySelector(".insti-events-screen")?.classList.remove("active");
    panel.querySelector(".insti-overview")?.classList.add("active");
  }
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  showLoading();
  Promise.allSettled([loadPosts(), loadVolunteers(), loadInstitutions()]).finally(hideLoading);
});
