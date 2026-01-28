const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../../index.html";
}

document.querySelectorAll(".btn-create-post, #openPostForm").forEach(btn => {
    if (!btn) return;
    btn.addEventListener("click", () => {
        const form = document.getElementById("postForm");
        const overlay = document.getElementById("postFormOverlay");
        if (!form || !overlay) return;
        form.classList.add("is-open");
        overlay.classList.add("is-open");
        overlay.setAttribute('aria-hidden', 'false');
    });
    
});

const desktopCreatePostBtn = document.getElementById("openPostFormDesktop");
if (desktopCreatePostBtn) {
    desktopCreatePostBtn.addEventListener("click", () => {
        const form = document.getElementById("postForm");
        const overlay = document.getElementById("postFormOverlay");
        if (!form || !overlay) return;
        form.classList.add("is-open");
        overlay.classList.add("is-open");
        overlay.setAttribute('aria-hidden', 'false');
    });
}

function closePostForm() {
    const form = document.getElementById("postForm");
    const overlay = document.getElementById("postFormOverlay");
    if (form) form.classList.remove("is-open");
    if (overlay) {
        overlay.classList.remove("is-open");
        overlay.setAttribute('aria-hidden', 'true');
    }
}

const closePostFormBtn = document.getElementById("closePostForm");
if (closePostFormBtn) closePostFormBtn.addEventListener("click", closePostForm);

const postFormOverlay = document.getElementById("postFormOverlay");
if (postFormOverlay) postFormOverlay.addEventListener("click", closePostForm);

function ensureLoadingOverlay() {
    if (document.getElementById('hvLoading')) return;
    const wrap = document.createElement('div');
    wrap.id = 'hvLoading';
    wrap.className = 'hv-loading';
    wrap.innerHTML = `
        <div class="hv-loading__backdrop"></div>
        <div class="hv-loading__card" role="status" aria-live="polite">
            <div class="hv-loading__spinner" aria-hidden="true"></div>
            <h3 class="hv-loading__title">Loading Community</h3>
            <div class="hv-loading__sub">Please wait a moment…</div>
        </div>
    `;
    document.body.appendChild(wrap);
}

let hvLoadingCount = 0;
function showLoading() {
    ensureLoadingOverlay();
    hvLoadingCount += 1;
    const el = document.getElementById('hvLoading');
    if (el) el.classList.add('is-open');
}

function hideLoading() {
    hvLoadingCount = Math.max(0, hvLoadingCount - 1);
    if (hvLoadingCount !== 0) return;
    const el = document.getElementById('hvLoading');
    if (el) el.classList.remove('is-open');
}

function ensureCongratsOverlay() {
    if (document.getElementById('hvCongrats')) return;

    const wrap = document.createElement('div');
    wrap.id = 'hvCongrats';
    wrap.className = 'hv-congrats';
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

    const close = () => wrap.classList.remove('is-open');
    wrap.addEventListener('click', (e) => {
        if (e.target?.dataset?.close === 'true') close();
    });
    const ok = wrap.querySelector('#hvCongratsOk');
    if (ok) ok.addEventListener('click', close);
}

function launchConfetti(container) {
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#ea8d2a', '#16a34a', '#2563eb', '#dc2626', '#0f172a', '#f59e0b'];
    const pieces = 28;
    for (let i = 0; i < pieces; i += 1) {
        const el = document.createElement('i');
        const left = Math.random() * 100;
        const delay = Math.random() * 120;
        const duration = 700 + Math.random() * 600;
        const rotate = Math.floor(Math.random() * 360);
        const w = 8 + Math.random() * 8;
        const h = 10 + Math.random() * 12;
        el.style.left = `${left}%`;
        el.style.background = colors[i % colors.length];
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.transform = `translateY(-10px) rotate(${rotate}deg)`;
        el.style.animationDelay = `${delay}ms`;
        el.style.animationDuration = `${duration}ms`;
        container.appendChild(el);
    }
}

function showCongrats(message) {
    ensureCongratsOverlay();
    const wrap = document.getElementById('hvCongrats');
    if (!wrap) return;
    const msg = wrap.querySelector('#hvCongratsMsg');
    if (msg) msg.textContent = message || '';
    const confetti = wrap.querySelector('.hv-confetti');
    launchConfetti(confetti);
    wrap.classList.add('is-open');

    window.clearTimeout(wrap._autoCloseTimer);
    wrap._autoCloseTimer = window.setTimeout(() => {
        wrap.classList.remove('is-open');
    }, 2200);
}

function getSectionElements(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return { section: null, body: null };
    const body = section.querySelector(".section-body");
    return { section, body };
}

function dismissPost(postCardEl) {
    if (!postCardEl) return;
    postCardEl.classList.add("is-dismissed");

    const removeTimer = setTimeout(() => {
        postCardEl.remove();
    }, 260);

    postCardEl.addEventListener("transitionend", () => {
        clearTimeout(removeTimer);
        postCardEl.remove();
    }, { once: true });
}


document.addEventListener("click", (e) => {
    const btn = e.target.closest?.(".post-collapse-btn");
    if (!btn) return;
    const card = btn.closest(".post-card");
    dismissPost(card);
});



async function submitPost() {
    const contentEl = document.getElementById("postContent");
    const visibilityEl = document.getElementById("postVisibility");
    const institutionEl = document.getElementById("postInstitution");

    const content = contentEl.value.trim();
    const visibility = visibilityEl.value;
    const institution = institutionEl.value;

    if (!content) {
        alert("Please write something before posting.");
        return;
    }

    const body = {
       content: content,
    visibility: visibility,
    taggedinstitutionid: institution ? parseInt(institution) : null
    };

    const res = await fetch("https://fsdp-cycling-ltey.onrender.com/community/posts", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
        alert(data.message || "Failed to create post");
        return;
    }

    alert(data.message || "Post created");
    contentEl.value = "";
    closePostForm();

    loadPosts();
}

async function loadPosts() {
    showLoading();
    try {
        const res = await fetch("https://fsdp-cycling-ltey.onrender.com/community/browse/posts", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const posts = await res.json();
        const container = document.querySelector(".feed-list");
        container.innerHTML = "";

        posts.forEach(p => {
            const avatarUrl = p.profilepicture || "./default_user.png";
            container.innerHTML += `
            <div class="post-card" data-post-id="${p.postid}">
            
            <div class="post-header">
                <img class="post-avatar" src="${avatarUrl}" alt="${p.username}'s avatar">
                <div>
                    <h4 class="post-user">${p.username}</h4>
                    <p class="post-time">${new Date(p.createdat).toLocaleString()}</p>
                </div>

                <div class="post-header-actions">
                    <button class="post-collapse-btn" type="button" aria-label="Hide this post">× Hide</button>
                </div>
            </div>

            <div class="post-body">
                <p class="post-text">${p.content}</p>

                ${p.photourl ? `<img class="post-img" src="${p.photourl}">` : ""}

                <div class="post-actions">
                    <button class="btn-like">
                        <i class="fa-solid fa-heart"></i> Like
                    </button>

                    <div class="like-display">
                        People Like: <span class="like-count">${p.likecount}</span>
                    </div>

                    <button class="btn-open-comments">
                        <i class="fa-solid fa-comment"></i> Comment
                    </button>
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
    document.querySelectorAll(".post-card").forEach(card => {
        const likeBtn = card.querySelector(".btn-like");
        const likeCountEl = card.querySelector(".like-count");
        const postId = card.getAttribute("data-post-id");

        if (!likeBtn || !likeCountEl || !postId) return;

        likeBtn.addEventListener("click", async () => {
            const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/community/posts/${postId}/like`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.message || "Failed to like");
                return;
            }

            let count = parseInt(likeCountEl.textContent);

            if (data.liked) {
                likeCountEl.textContent = count + 1;
                likeBtn.classList.add("liked");
            } else {
                likeCountEl.textContent = Math.max(count - 1, 0);
                likeBtn.classList.remove("liked");
            }
        });
    });
}

let currentPostId = null;

function attachCommentEvents() {
    document.querySelectorAll(".post-card").forEach(card => {
        const postId = card.getAttribute("data-post-id");
        const openBtn = card.querySelector(".btn-open-comments") || card.querySelector(".btn-comment");
        const list = card.querySelector(".post-comments");

       
        if (openBtn) openBtn.addEventListener("click", () => {
            currentPostId = postId;
            const panel = document.getElementById("globalCommentPanel");
            const overlay = document.getElementById("globalCommentOverlay");
            const input = document.getElementById("globalCommentInput");
            if (panel) panel.classList.add("show");
            
            if (overlay) overlay.style.display = "block";
            document.body.style.overflow = "hidden";
            if (input) input.value = "";
        });

        
        loadComments(postId, list);
    });
}


function openGlobalCommentForPost(postId) {
    if (!postId) return;
    currentPostId = postId;
    const panel = document.getElementById("globalCommentPanel");
    const overlay = document.getElementById("globalCommentOverlay");
    const input = document.getElementById("globalCommentInput");
    if (panel) panel.classList.add("show");
    if (overlay) overlay.style.display = "block";
    if (input) input.value = "";
}

document.addEventListener("click", (e) => {
    const btn = e.target.closest?.(".btn-open-comments, .btn-comment");
    if (!btn) return;
    const card = btn.closest?.('.post-card');
    const postId = card?.getAttribute?.('data-post-id');
    openGlobalCommentForPost(postId);
});


const closeGlobalBtn = document.getElementById("closeGlobalComment");
if (closeGlobalBtn) closeGlobalBtn.addEventListener("click", closeCommentBox);

const globalOverlay = document.getElementById("globalCommentOverlay");
if (globalOverlay) globalOverlay.addEventListener("click", closeCommentBox);

function closeCommentBox() {

    document.getElementById("globalCommentPanel").classList.remove("show");
    document.getElementById("globalCommentOverlay").style.display = "none";
        document.body.style.overflow = "";
    
}


const globalSendBtn = document.getElementById("globalCommentSend");
if (globalSendBtn) globalSendBtn.addEventListener("click", async () => {
    const input = document.getElementById("globalCommentInput");
    const text = (input ? input.value : '').trim();
    if (!text || !currentPostId) return;

    const res = await fetch(`https://fsdp-cycling-ltey.onrender.com/community/posts/${currentPostId}/comments`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ CommentText: text })
    });

    if (!res.ok) {
        let data;
        try {
            data = await res.json();
        } catch {
            data = null;
        }
        alert(data?.message || 'Failed to post comment');
        return;
    }

    closeCommentBox();

    showCongrats('Comment posted successfully!');

    // update comment list instantly
    const postCard = document.querySelector(`.post-card[data-post-id="${currentPostId}"]`);
    const list = postCard ? postCard.querySelector(".post-comments") : null;

    loadComments(currentPostId, list);
});





async function loadComments(postId, container) {
  if (!container) return;

  const res = await fetch(
    `https://fsdp-cycling-ltey.onrender.com/community/posts/${postId}/comments`,
    { headers: { "Authorization": `Bearer ${token}` } }
  );

  if (!res.ok) {
    console.error("Load comments failed:", res.status);
    container.innerHTML = "";
    return;
  }

  const comments = await res.json();
  container.innerHTML = "";

  if (!Array.isArray(comments)) return;

  comments.forEach(c => {
    const avatarUrl = c.profilepicture || "./default_user.png";
    container.innerHTML += `
      <div class="comment-item">
        <img class="comment-avatar" src="${avatarUrl}" alt="${c.username}'s avatar">
        <div class="comment-content">
          <strong>${c.username}:</strong>
          <span>${c.commenttext}</span>
          <div class="comment-time">${new Date(c.createdat).toLocaleString()}</div>
        </div>
      </div>
    `;
  });
}









async function loadVolunteers() {
    showLoading();
    try {
        const res = await fetch("https://fsdp-cycling-ltey.onrender.com/community/browse/volunteers", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const list = await res.json();

        const container = document.querySelector(".people-scroll");
        container.innerHTML = "";

        list.forEach(v => {
            container.innerHTML += `
                <div class="people-card">
                    <img src="${v.profilepicture || './default_user.png'}" class="people-avatar" alt="${v.name}'s avatar">
                    <h4 class="people-name">${v.name}</h4>
                    <button class="btn-add">Add Friend</button>
                </div>
            `;
        });
    } finally {
        hideLoading();
    }
}



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

    tabs.innerHTML = "";
    panels.innerHTML = "";

    data.forEach((org, index) => {
  tabs.innerHTML += `
    <button class="insti-btn ${index === 0 ? "active" : ""}"
      data-target="inst_${org.organizationid}">
      ${org.orgname}
    </button>
  `;

  panels.innerHTML += `
    <div id="inst_${org.organizationid}" class="insti-panel ${index === 0 ? "active" : ""}">
      <div class="insti-overview active">
        <div class="insti-banner">
          <img src="./default_org.jpg" class="insti-banner-img">
          <div class="insti-banner-overlay">
            <h3>${org.orgname}</h3>
          </div>
        </div>

        <div class="insti-description">
          <p>${org.orgdescription ?? ""}</p>
        </div>

        <div class="insti-stats">
          <div class="stat-box">
            <span>${(org.events || []).length}</span>
            <label>Events</label>
          </div>
        </div>

        <button class="insti-view-events-btn"
          onclick="openInstitutionEvents('${org.organizationid}')">
          View Events →
        </button>
      </div>

      <div class="insti-events-screen">
        <button class="back-btn" onclick="goBackToInstitution('${org.organizationid}')">← Back</button>

        <h3 class="events-title">${org.orgname} - Events</h3>

        <div class="insti-events-list">
          ${
            (!org.events || org.events.length === 0)
            ? `<p class="no-events">No events available</p>`
            : org.events.map(e => `
              <div class="event-card" onclick="openEventDetail(${e.eventid})">
                <h4>${e.eventname}</h4>
                <p>${new Date(e.eventdate).toLocaleDateString()}</p>
                <p>${e.location}</p>
                <p>Number of Volunteer Required: ${e.requiredvolunteers}</p>
                <button class="btn">Join Event</button>
              </div>
            `).join("")
          }
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
    window.location.href = `./volunteer_event_detail.html?eventId=${eventId}`;
}


function attachInstitutionTabEvents() {
    const btns = document.querySelectorAll(".insti-btn");

    btns.forEach(btn => {
        btn.addEventListener("click", () => {

            btns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            document.querySelectorAll(".insti-panel")
                .forEach(p => p.classList.remove("active"));

            const panel = document.getElementById(btn.getAttribute("data-target"));
            panel.classList.add("active");
        });
    });
}


function openInstitutionEvents(id) {
    const panel = document.getElementById("inst_" + id);
    panel.querySelector(".insti-overview").classList.remove("active");
    panel.querySelector(".insti-events-screen").classList.add("active");
}



function goBackToInstitution(id) {
    const panel = document.getElementById("inst_" + id);
    panel.querySelector(".insti-events-screen").classList.remove("active");
    panel.querySelector(".insti-overview").classList.add("active");
}



document.addEventListener("DOMContentLoaded", () => {
    (async () => {
        showLoading();
        try {
            await Promise.allSettled([
                loadPosts(),
                loadVolunteers(),
                loadInstitutions()
            ]);
        } finally {
            hideLoading();
        }
    })();
});
