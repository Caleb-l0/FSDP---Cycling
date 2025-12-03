async function loadVolunteers() {
    const res = await fetch("https://fsdp-cycling-ltey.onrender.com/community/browse/volunteers", {
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
document.addEventListener("DOMContentLoaded", () => {
    loadPosts();
    loadVolunteers();   // ← THIS loads the friends/volunteers list
    loadInstitutions();
});
