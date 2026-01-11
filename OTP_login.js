 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

  const firebaseConfig = {
    apiKey: "AIzaSyBV6fsk3wA30Ijv9u0-p8PG7JvG87P15xI",
    authDomain: "cyclingwithoutage-d9ab6.firebaseapp.com",
    projectId: "cyclingwithoutage-d9ab6",
    storageBucket: "cyclingwithoutage-d9ab6.firebasestorage.app",
    messagingSenderId: "71350491546",
    appId: "1:71350491546:web:0632e3238c7b7872578223"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // expose to your existing index.js
  window.firebaseAuth = auth;
  window.firebaseSignInWithPhoneNumber = signInWithPhoneNumber;
  window.firebaseRecaptchaVerifier = RecaptchaVerifier;