 // ========================
// GLOBAL UI PREFERENCE KEYS
// ========================

const TEXT_SIZE_KEY = 'textSizePreference';

    // Load header dynamically
    fetch('./public/header.html')
      .then(res => res.text())
      .then(data => document.getElementById('header-placeholder').innerHTML = data);

    // Hero slider
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    function showSlide(index){ slides.forEach((s,i)=>s.classList.toggle('active',i===index)); dots.forEach((d,i)=>d.classList.toggle('active',i===index)); }
    function nextSlide(){ currentSlide=(currentSlide+1)%slides.length; showSlide(currentSlide); }
    dots.forEach((dot,i)=>dot.addEventListener('click',()=>{ currentSlide=i; showSlide(i); }));
    setInterval(nextSlide,5000);

    // Modals
    function openLogin(){document.getElementById('loginModal').classList.add('active');}
    function closeLogin(){document.getElementById('loginModal').classList.remove('active');}
    function openSignup(){document.getElementById('signupModal').classList.add('active');}
    function closeSignup(){document.getElementById('signupModal').classList.remove('active');}
    function switchToSignup(){ closeLogin(); openSignup(); }
    function switchToLogin(){ closeSignup(); openLogin(); }

    // Enhanced Toast (centered, modal-like)
    function createWowToast(message, type='success'){
      const toast=document.createElement('div');
      toast.className='toast-message';
      toast.innerHTML = `<div class="toast-content">${message}</div>`;
      Object.assign(toast.style,{
        position:'fixed',
        top:'50%',
        left:'50%',
        transform:'translate(-50%, -50%)',
        width:'350px',
        maxWidth:'90%',
        padding:'25px 30px',
        fontSize:'18px',
        fontWeight:'700',
        fontFamily:"'Quicksand', sans-serif",
        color:'#fff',
        textAlign:'center',
        borderRadius:'15px',
        background: type==='success' ? 'linear-gradient(135deg, #ffb347, #ffcc33)' : 'linear-gradient(135deg, #ff6b6b, #ff3d3d)',
        boxShadow:'0 10px 30px rgba(0,0,0,0.3)',
        opacity:'0',
        zIndex:'99999',
        transition:'opacity 0.4s ease, transform 0.4s ease'
      });
      document.body.appendChild(toast);
      setTimeout(()=>{ toast.style.opacity='1'; toast.style.transform='translate(-50%, -50%) scale(1)'; },50);
      setTimeout(()=>{ toast.style.opacity='0'; toast.style.transform='translate(-50%, -50%) scale(0.8)'; toast.addEventListener('transitionend',()=>toast.remove()); },2000);
    }

    // Signup
    async function signup(event){
      event.preventDefault();
      const name=document.getElementById('signup-name').value;
      const email=document.getElementById('signup-email').value;
      const password=document.getElementById('signup-password').value;
      const role=document.getElementById('role').value;
      try{
        const res=await fetch('https://fsdp-cycling-ltey.onrender.com/signup',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({name,email,password,role})
        });
        const data=await res.json();
        if(!res.ok){ createWowToast(data.message||'Signup failed','error'); return; }
        createWowToast('Account created successfully!','success');
        closeSignup();
      }catch(err){ console.error(err); createWowToast('❌ Error connecting to server','error'); }
    }

    // Login
    async function login(event){
      event.preventDefault();
      const email=document.getElementById('email').value;
      const password=document.getElementById('password').value;
      try{
        const res=await fetch('https://fsdp-cycling-ltey.onrender.com/login',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({email,password})
        });
        const data=await res.json();
        if(!res.ok){ createWowToast(data.message||'Login failed','error'); return; }
        createWowToast('Login successful!','success');
        localStorage.setItem("token",data.token);
        localStorage.setItem("userId",data.userId);
        localStorage.setItem("name",data.name);
        localStorage.setItem("email",data.email);
        localStorage.setItem("role",data.role);
      const preference = data.textSizePreference || localStorage.getItem(TEXT_SIZE_KEY) || 'normal';
      localStorage.setItem(TEXT_SIZE_KEY, preference);
      applyTextSize(preference);

        setTimeout(()=>{
          switch(data.role){
            case 'admin': window.location.href='/public/Admin/homepage_login_Admin.html'; break;
            case 'volunteer': window.location.href='/public/Volunteer/homepage_login_volunteer.html'; break;
            case 'institution': window.location.href='/public/Instituition/homepage_login_instituition.html'; break;
          }
        },1500);

      }catch(err){ console.error(err); createWowToast('❌ Error connecting to server','error'); }
    }

    // Text size toggle (senior-friendly control)
   
    const normalTextBtn = document.getElementById('normalTextBtn');
    const largeTextBtn = document.getElementById('largeTextBtn');

    function applyTextSize(mode) {
      const useLarge = mode === 'large';
      const normalized = useLarge ? 'large' : 'normal';
      document.body.classList.toggle('large-text-mode', useLarge);
      normalTextBtn.setAttribute('aria-pressed', String(!useLarge));
      largeTextBtn.setAttribute('aria-pressed', String(useLarge));
      if (window.setTextSizePreference) {
        window.setTextSizePreference(normalized);
      } else {
        localStorage.setItem(TEXT_SIZE_KEY, normalized);
      }
    }

    normalTextBtn.addEventListener('click', () => applyTextSize('normal'));
    largeTextBtn.addEventListener('click', () => applyTextSize('large'));

    applyTextSize(localStorage.getItem(TEXT_SIZE_KEY) || 'normal');





  
// pop up

  function showLanguagePopup() {
    document.getElementById("languagePopup").classList.add("active");
  }

  function hideLanguagePopup() {
    document.getElementById("languagePopup").classList.remove("active");
  }

  // Run on first load
  document.addEventListener("DOMContentLoaded", () => {
    
    const savedLang = localStorage.getItem("targetLanguage");

    if (!savedLang) {
      // No language saved → show popup
      showLanguagePopup();
    } else {
      // Already have language → translate immediately
      if (typeof translatePage === "function") {
        translatePage(savedLang);
      }
    }
  });

  //Google





  //

  // Handle language selection
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const chosenLang = btn.dataset.lang;
      localStorage.setItem("targetLanguage", chosenLang);

      hideLanguagePopup();

      if (typeof translatePage === "function") {
        translatePage(chosenLang);
      }
    });
  });



  // Google log in
  /* ======================================================
   GOOGLE LOGIN – FRONTEND (FINAL)
====================================================== */

const GOOGLE_CLIENT_ID =
  "59962105456-6vl8vtct35g021l2vasre70lngih92cc.apps.googleusercontent.com";


function waitForGoogle(maxWaitMs = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - start > maxWaitMs) {
        clearInterval(timer);
        reject(new Error("Google SDK not loaded"));
      }
    }, 50);
  });
}


async function initGoogleLogin() {
  try {
    await waitForGoogle();

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    });

   
    const container = document.getElementById("googleButtonContainer");
    if (container) {
      google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with"
      });
    }

    const googleBtn = document.getElementById("googleLoginBtn");
    if (googleBtn) {
      googleBtn.addEventListener("click", () => {
        google.accounts.id.prompt((notification) => {
          if (
            notification.isNotDisplayed() ||
            notification.isSkippedMoment()
          ) {
            createWowToast(
              "Google popup was blocked. Please use the Google button below.",
              "error"
            );
          }
        });
      });
    }

  } catch (err) {
    console.error("Google init failed:", err);
    createWowToast(
      "Google login failed to load. Please refresh the page.",
      "error"
    );
  }
}


async function handleGoogleCredential(response) {
  try {
    const googleToken = response?.credential;
    if (!googleToken) {
      createWowToast("Google login failed.", "error");
      return;
    }


    const res = await fetch(
      "https://fsdp-cycling-ltey.onrender.com/auth/google",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: googleToken })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      createWowToast(data.message || "Google login failed.", "error");
      return;
    }

 
    createWowToast("Login successful!", "success");

    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("name", data.name);
    localStorage.setItem("email", data.email);
    localStorage.setItem("role", data.role);

 
    setTimeout(() => {
      switch (data.role) {
        case "admin":
          window.location.href = "/public/Admin/homepage_login_Admin.html";
          break;
        case "volunteer":
          window.location.href = "/public/Volunteer/homepage_login_volunteer.html";
          break;
        case "institution":
          window.location.href = "/public/Instituition/homepage_login_instituition.html";
          break;
        default:
          window.location.href = "/";
      }
    }, 1000);

  } catch (err) {
    console.error("Google login error:", err);
    createWowToast("Google login failed. Try again.", "error");
  }
}


document.addEventListener("DOMContentLoaded", initGoogleLogin);
