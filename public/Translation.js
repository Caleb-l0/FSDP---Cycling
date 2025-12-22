let translateController = null;
let translationInProgress = false;

const TEXT_SIZE_KEY = "happyVolunteerTextSize";
const DEFAULT_TEXT_SIZE = "normal";

/* ================= TEXT SIZE ================= */

function normalizeTextSizeValue(value) {
  return value === "large" ? "large" : DEFAULT_TEXT_SIZE;
}

function getTextSizePreference() {
  return normalizeTextSizeValue(localStorage.getItem(TEXT_SIZE_KEY));
}

function applyTextSizePreference(mode) {
  const normalized = normalizeTextSizeValue(mode);
  document.body.classList.toggle("large-text-mode", normalized === "large");
  document.documentElement.setAttribute("data-text-size", normalized);
}

function setTextSizePreference(mode) {
  const normalized = normalizeTextSizeValue(mode);
  localStorage.setItem(TEXT_SIZE_KEY, normalized);
  applyTextSizePreference(normalized);
}

window.setTextSizePreference = setTextSizePreference;

/* ================= TRANSLATION ================= */

async function translatePage(targetLang) {
  if (translationInProgress) return;

  translationInProgress = true;
  localStorage.setItem("targetLanguage", targetLang);

  if (translateController) translateController.abort();
  translateController = new AbortController();
  const signal = translateController.signal;

  const apiURL = "https://fsdp-cycling-ltey.onrender.com/translate";

  try {
    const elements = document.querySelectorAll(
      "h1,h2,h3,h4,h5,h6,p,span,a,button,label,li,th,td"
    );

    for (const el of elements) {
      if (signal.aborted) break;

      if (
        el.children.length === 0 &&
        el.childNodes.length === 1 &&
        el.childNodes[0].nodeType === Node.TEXT_NODE
      ) {
        const originalText = el.textContent.trim();
        if (!originalText) continue;

        const cached = getCachedTranslation(targetLang, originalText);
        if (cached) {
          el.textContent = cached;
          continue;
        }

        try {
          const response = await fetch(apiURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              q: originalText,
              from: "auto",
              to: targetLang
            }),
            signal
          });

          if (!response.ok) continue;

          const data = await response.json();
          if (!data?.translatedText) continue;

          el.textContent = data.translatedText;
          saveTranslationToCache(targetLang, originalText, data.translatedText);

          await new Promise(r => setTimeout(r, 120));
        } catch(err) {
            console.error("Translate fetch failed:", err);
          continue;
        }
      }
    }
  } finally {

    translationInProgress = false;
  }
}

/* ================= CACHE ================= */

function getCachedTranslation(lang, text) {
  const cache = JSON.parse(localStorage.getItem("translationCache") || "{}");
  return cache?.[lang]?.[text] || null;
}

function saveTranslationToCache(lang, original, translated) {
  const cache = JSON.parse(localStorage.getItem("translationCache") || "{}");
  if (!cache[lang]) cache[lang] = {};
  cache[lang][original] = translated;
  localStorage.setItem("translationCache", JSON.stringify(cache));
}

function changeLanguage(lang) {
  if (translationInProgress) return;
  localStorage.removeItem("translationCache");
  translatePage(lang);
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  applyTextSizePreference(getTextSizePreference());

  const savedLang = localStorage.getItem("targetLanguage");
  if (savedLang) translatePage(savedLang);
});


window.changeLanguage = changeLanguage;
window.translatePage = translatePage;