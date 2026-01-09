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
});
