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
    const res = await fetch("https://fsdp-cycling-ltey.onrender.com/community/browse/posts", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });

    const posts = await res.json();
    const container = document.querySelector(".feed-list");
    container.innerHTML = "";

    posts.forEach(p => {
        container.innerHTML += `
        <div class="post-card" data-post-id="${p.postid}">
            
            <div class="post-header">
                <img class="post-avatar" src="./default_user.png">
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

}


function attachLikeEvents() {
    document.querySelectorAll(".post-card").forEach(card => {
        const likeBtn = card.querySelector(".btn-like");
        const likeCountEl = card.querySelector(".like-count");
        const postId = card.getAttribute("data-post-id");

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
            if (input) input.value = "";
        });

        
        loadComments(postId, list);
    });
}


document.getElementById("closeGlobalComment").addEventListener("click", closeCommentBox);
document.getElementById("globalCommentOverlay").addEventListener("click", closeCommentBox);

function closeCommentBox() {
    document.getElementById("globalCommentPanel").classList.remove("show");
    document.getElementById("globalCommentOverlay").style.display = "none";
}


document.getElementById("globalCommentSend").addEventListener("click", async () => {
    const text = document.getElementById("globalCommentInput").value.trim();
    if (!text || !currentPostId) return;

    await fetch(`https://fsdp-cycling-ltey.onrender.com/community/posts/${currentPostId}/comments`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ CommentText: text })
    });

    closeCommentBox();

    // update comment list instantly
    const postCard = document.querySelector(`.post-card[data-post-id="${currentPostId}"]`);
    const list = postCard.querySelector(".post-comments");

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
    container.innerHTML += `
      <div class="comment-item">
        <strong>${c.username}:</strong>
        <span>${c.commenttext}</span>
        <div class="comment-time">${new Date(c.createdat).toLocaleString()}</div>
      </div>
    `;
  });
}









async function loadVolunteers() {
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
                <img src="./default_user.png" class="people-avatar">
                <h4 class="people-name">${v.name}</h4>
                <button class="btn-add">Add Friend</button>
            </div>
        `;
    });
}



async function loadInstitutions() {
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
    loadPosts();
    loadVolunteers();
    loadInstitutions();
});
