const token = localStorage.getItem("token")
if (!token) {
    alert("Please log in first")
    window.location.href = '../../index.html'
}

document.querySelectorAll(".btn-create-post, #openPostForm").forEach(btn => {
    btn.addEventListener("click", () => {
        const form = document.getElementById("postForm");
        form.style.display = form.style.display === "block" ? "none" : "block";
    });
});


async function submitPost() {
    const content = document.getElementById("postContent").value;
    const visibility = document.getElementById("postVisibility").value;
    const institution = document.getElementById("postInstitution").value;

    const body = {
        Content: content,
        Visibility: visibility,
        TaggedInstitutionID: institution ? parseInt(institution) : null
    };

    const res = await fetch("http://localhost:3000/community/posts", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,   // ADDED
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    alert(data.message);

    loadPosts();
}


async function loadPosts() {
    const res = await fetch("http://localhost:3000/community/browse/posts", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`   // ADDED
        }
    });

    const posts = await res.json();

    const container = document.querySelector(".feed-list");
    container.innerHTML = "";

    posts.forEach(p => {
        container.innerHTML += `
        <div class="post-card">

            <div class="post-header">
                <img class="post-avatar" src="./default_user.png">
                <div>
                    <h4 class="post-user">${p.UserName}</h4>
                    <p class="post-time">${new Date(p.CreatedAt).toLocaleString()}</p>
                </div>
            </div>

            <p class="post-text">${p.Content}</p>

            ${p.PhotoURL ? `<img class="post-img" src="${p.PhotoURL}">` : ""}

            <div class="post-actions">
                <button class="btn-like"><i class="fa-solid fa-heart"></i> Like</button>
                <button class="btn-comment"><i class="fa-solid fa-comment"></i> Comment</button>
            </div>

            <div class="comment-box">
                <input type="text" placeholder="Write a comment...">
                <button class="btn-small">Post</button>
            </div>

        </div>`;
    });
}



async function loadVolunteers() {
    const res = await fetch("http://localhost:3000/community/browse/volunteers", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`   // ADDED
        }
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
        </div>`;
    });
}



async function loadInstitutions() {
    const res = await fetch("http://localhost:3000/community/browse/institutions", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`   // ADDED
        }
    });

    const data = await res.json();

    data.forEach(org => {
        const panel = document.getElementById(org.OrganizationID);
        if (!panel) return;

        panel.innerHTML = `
        <div class="insti-bg" style="background-image:url('./default_org.jpg')">
            <div class="insti-overlay">
                <h3>${org.OrgName}</h3>
                <p>${org.OrgDescription}</p>
            </div>
        </div>

        <div class="insti-events">
            ${org.Events.map(e => `
                <div class="insti-card">
                    <h4>${e.EventName}</h4>
                    <p>${new Date(e.EventDate).toLocaleDateString()}</p>
                    <button class="btn">Join Event</button>
                </div>
            `).join("")}
        </div>
        `;
    });
}


document.addEventListener("DOMContentLoaded", () => {
    loadPosts();
    loadVolunteers();
    loadInstitutions();
});
