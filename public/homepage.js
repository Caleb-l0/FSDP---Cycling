   const hvNavToggle = document.getElementById("hvNavToggle");
const hvNav = document.getElementById("hvNav");

// Toggle mobile navigation
hvNavToggle.addEventListener("click", () => {
    hvNav.classList.toggle("active");
});


let heroIndex = 0;
const heroSlides = document.querySelectorAll(".hero-slide");
const heroDots = document.querySelectorAll(".hero-dot");

function showHeroSlide(i) {
    heroSlides.forEach((s, idx) => s.classList.toggle("active", idx === i));
    heroDots.forEach((d, idx) => d.classList.toggle("active", idx === i));
}

function nextHeroSlide() {
    heroIndex = (heroIndex + 1) % heroSlides.length;
    showHeroSlide(heroIndex);
}

heroDots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
        heroIndex = i;
        showHeroSlide(i);
    });
});

setInterval(nextHeroSlide, 5000);


    // Nav toggle


    // Horizontal scroll buttons
    document.querySelectorAll('.scroll-wrapper').forEach(wrapper => {
        const leftBtn = wrapper.querySelector('.left');
        const rightBtn = wrapper.querySelector('.right');
        const scrollable = wrapper.querySelector('.scrollable');

        leftBtn.addEventListener('click', () => {
            scrollable.scrollBy({ left: -300, behavior: 'smooth' });
        });
        rightBtn.addEventListener('click', () => {
            scrollable.scrollBy({ left: 300, behavior: 'smooth' });
        });
    });

   


/* Mobile Nav */
document.getElementById("hvNavToggle").addEventListener("click", () => {
    document.getElementById("mainNav").classList.toggle("active");
});


document.addEventListener("DOMContentLoaded", () => {
    const name = localStorage.getItem("name");
    const userStatus = document.getElementById("userStatus");

    if (name && userStatus) {
        userStatus.textContent = "Logged in as " + name;
    }
    
    // Load text size preference for volunteer pages
    loadTextSizePreference();
});

// ======================================================
// Load and Apply Text Size Preference
// ======================================================
function loadTextSizePreference() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    // Only apply to volunteer pages
    if (!token || role !== "volunteer") return;
    
    // Check localStorage first (faster)
    const localPreference = localStorage.getItem("happyVolunteerTextSize");
    if (localPreference) {
        applyTextSizeToPage(localPreference);
        return;
    }
    
    // If not in localStorage, fetch from backend
    fetch("https://fsdp-cycling-ltey.onrender.com/profile", {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
        if (data && data.textSizePreference) {
            const preference = data.textSizePreference;
            localStorage.setItem("happyVolunteerTextSize", preference);
            applyTextSizeToPage(preference);
        }
    })
    .catch(err => console.log("Could not load text size preference:", err));
}

// Apply text size to current page
function applyTextSizeToPage(mode) {
    if (mode === 'large' || mode === 'elderly') {
        document.body.classList.add('elderly-mode');
        document.documentElement.setAttribute('data-text-size', 'large');
    } else {
        document.body.classList.remove('elderly-mode');
        document.documentElement.setAttribute('data-text-size', 'normal');
    }
}
