

    // Load header dynamically

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

async function showOtpSignup() {
  const email = document.getElementById("signup-email-otp").value.trim();

  if (!email) {
    createWowToast("Please enter an email first", "error");
    return;
  }

  // First, check if email already exists
  try {
    const checkRes = await fetch("https://fsdp-cycling-ltey.onrender.com/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email })
    });

    const checkData = await checkRes.json();

    if (checkData.exists) {
      createWowToast("Email already exists. Please use login instead.", "error");
      return;
    }

    // Email doesn't exist - proceed with OTP
    generatedOtp = generateOtp();
    otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    emailjs.send(
      "service_mbk5pgl",
      "template_w5klqcn",     
      {
        to_email: email,
        otp: generatedOtp
      }
    )
    .then(() => {
      createWowToast("OTP sent to your email", "success");
      document.getElementById("signupDefaultMode").style.display = "none";
      // Use the signup modal's OTP step if it exists, otherwise use the shared one
      const otpStepSignup = document.getElementById("otpStepSignup");
      if (otpStepSignup) {
        otpStepSignup.style.display = "block";
        otpStepSignup.setAttribute("data-mode", "signup");
        otpStepSignup.setAttribute("data-email", email);
      } else {
        // Fallback to shared OTP step (in login modal)
        document.getElementById("otpStep").style.display = "block";
        document.getElementById("otpStep").setAttribute("data-mode", "signup");
        document.getElementById("otpStep").setAttribute("data-email", email);
      }
    })
    .catch(err => {
      console.error(err);
      createWowToast("Failed to send OTP", "error");
    });

  } catch (err) {
    console.error("Error checking email:", err);
    createWowToast("Error checking email. Please try again.", "error");
  }
}

    // Login
    async function login(event){
      event.preventDefault();
      const email=document.getElementById('login-email').value;
      const password=document.getElementById('login-password').value;
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


  function closeLangPopupWithoutTranslate() {
    localStorage.setItem("targetLanguage", "en");
    hideLanguagePopup();
    
  }

  const langPopupClose = document.getElementById("langPopupClose");
  const langPopupCloseSkip = document.getElementById("langPopupCloseSkip");
  if (langPopupClose) langPopupClose.addEventListener("click", closeLangPopupWithoutTranslate);
  if (langPopupCloseSkip) langPopupCloseSkip.addEventListener("click", closeLangPopupWithoutTranslate);



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

    // Render Google button in login container
    const container = document.getElementById("googleButtonContainer");
    if (container && !container.querySelector('div[role="button"]')) {
      google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with"
      });
    }

    // Render Google button in signup container
    const signupContainer = document.getElementById("googleSignupButtonContainer");
    if (signupContainer && !signupContainer.querySelector('div[role="button"]')) {
      google.accounts.id.renderButton(signupContainer, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with"
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


let generatedOtp = null;
let otpExpiry = null;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Toggle between OTP/Google mode and Password mode
function togglePasswordMode(mode) {
  if (mode === 'login') {
    const defaultMode = document.getElementById('loginDefaultMode');
    const passwordMode = document.getElementById('loginPasswordMode');
    
    if (defaultMode.style.display === 'none') {
      // Switch to OTP/Google mode
      defaultMode.style.display = 'block';
      passwordMode.style.display = 'none';
      // Sync email if exists
      const passwordEmail = document.getElementById('login-email').value;
      if (passwordEmail) {
        document.getElementById('email').value = passwordEmail;
      }
    } else {
      // Switch to Password mode
      defaultMode.style.display = 'none';
      passwordMode.style.display = 'block';
      // Sync email if exists
      const defaultEmail = document.getElementById('email').value;
      if (defaultEmail) {
        document.getElementById('login-email').value = defaultEmail;
      }
    }
  } else if (mode === 'signup') {
    const defaultMode = document.getElementById('signupDefaultMode');
    const passwordMode = document.getElementById('signupPasswordMode');
    
    if (defaultMode.style.display === 'none') {
      // Switch to OTP/Google mode
      defaultMode.style.display = 'block';
      passwordMode.style.display = 'none';
    } else {
      // Switch to Password mode
      defaultMode.style.display = 'none';
      passwordMode.style.display = 'block';
    }
  }
}

async function showOtp() {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    createWowToast("Please enter an email first", "error");
    return;
  }

  // For LOGIN, check if user exists first
  try {
    const checkRes = await fetch("https://fsdp-cycling-ltey.onrender.com/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email })
    });

    const checkData = await checkRes.json();

    if (!checkData.exists) {
      createWowToast("Email not found. Please sign up first.", "error");
      return;
    }

    // User exists - proceed with OTP
    generatedOtp = generateOtp();
    otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    emailjs.send(
      "service_mbk5pgl",
      "template_w5klqcn",     
      {
        to_email: email,
        otp: generatedOtp
      }
    )
    .then(() => {
      createWowToast("OTP sent to your email", "success");

      document.getElementById("loginDefaultMode").style.display = "none";
      document.getElementById("otpStep").style.display = "block";
      document.getElementById("otpStep").setAttribute("data-mode", "login");
      document.getElementById("otpStep").setAttribute("data-email", email);
    })
    .catch(err => {
      console.error(err);
      createWowToast("Failed to send OTP", "error");
    });

  } catch (err) {
    console.error("Error checking email:", err);
    createWowToast("Error checking email. Please try again.", "error");
  }
}

async function verifyOtp() {
  // Check which OTP input is being used (login or signup)
  const otpInput = document.getElementById("otp") || document.getElementById("otpSignup");
  const userOtp = otpInput ? otpInput.value.trim() : "";
  
  // Check which OTP step container is active
  const otpStepSignup = document.getElementById("otpStepSignup");
  const otpStep = document.getElementById("otpStep");
  const activeOtpStep = otpStepSignup && otpStepSignup.style.display !== "none" ? otpStepSignup : otpStep;
  
  const mode = activeOtpStep ? activeOtpStep.getAttribute("data-mode") || "login" : "login";
  
  // Get email from stored attribute or input field
  let email = activeOtpStep ? activeOtpStep.getAttribute("data-email") : "";
  if (!email) {
    // Fallback to input fields
    const emailInput = document.getElementById("email") || document.getElementById("signup-email-otp");
    email = emailInput ? emailInput.value.trim() : "";
  }

  if (!email) {
    createWowToast("Email not found. Please start over.", "error");
    return;
  }

  if (!generatedOtp) {
    createWowToast("No OTP generated", "error");
    return;
  }

  if (Date.now() > otpExpiry) {
    createWowToast("OTP expired", "error");
    return;
  }

  if (userOtp !== generatedOtp) {
    createWowToast("Invalid OTP", "error");
    return;
  }

  // OTP is valid - now call backend to login/create account
  try {
    const res = await fetch("https://fsdp-cycling-ltey.onrender.com/login/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email }),
    });

    const data = await res.json();

    if (!res.ok) {
      createWowToast(data.message || "Login failed", "error");
      return;
    }

    // Store user data in localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("name", data.name);
    localStorage.setItem("email", data.email);
    localStorage.setItem("role", data.role);

    const preference = data.textSizePreference || localStorage.getItem(TEXT_SIZE_KEY) || "normal";
    localStorage.setItem(TEXT_SIZE_KEY, preference);
    if (window.applyTextSize) {
      applyTextSize(preference);
    }

    // Show success message
    if (data.isNewUser) {
      createWowToast("Account created and logged in successfully!", "success");
    } else {
      createWowToast("OTP verified! Login successful", "success");
    }

    // Clear OTP
    generatedOtp = null;
    if (activeOtpStep) {
      activeOtpStep.removeAttribute("data-email");
      activeOtpStep.style.display = "none";
    }
    // Clear OTP inputs
    if (document.getElementById("otp")) document.getElementById("otp").value = "";
    if (document.getElementById("otpSignup")) document.getElementById("otpSignup").value = "";

    // Redirect based on role
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
          window.location.href = "/public/Volunteer/homepage_login_volunteer.html";
      }
    }, 1500);
  } catch (err) {
    console.error("OTP login error:", err);
    createWowToast("Error connecting to server", "error");
  }
}


function backToLogin() {
  document.getElementById("otpStep").style.display = "none";
  if (document.getElementById("otp")) document.getElementById("otp").value = "";
  document.getElementById("loginDefaultMode").style.display = "block";
  document.getElementById("otpStep").removeAttribute("data-mode");
  document.getElementById("otpStep").removeAttribute("data-email");
  generatedOtp = null;
}

function backToSignup() {
  const otpStepSignup = document.getElementById("otpStepSignup");
  if (otpStepSignup) {
    otpStepSignup.style.display = "none";
    if (document.getElementById("otpSignup")) document.getElementById("otpSignup").value = "";
  }
  document.getElementById("signupDefaultMode").style.display = "block";
  if (otpStepSignup) {
    otpStepSignup.removeAttribute("data-mode");
    otpStepSignup.removeAttribute("data-email");
  }
  generatedOtp = null;
}


