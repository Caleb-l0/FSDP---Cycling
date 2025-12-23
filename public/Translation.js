// Translation.js
console.log("Translation.js LOADED");

const TEXT_SIZE_KEY = "happyVolunteerTextSize";
const DEFAULT_TEXT_SIZE = "normal";
let translationInProgress = false;

/**
 * TEXT SIZE MANAGEMENT
 */
function normalizeTextSizeValue(value) {
    return value === "large" ? "large" : DEFAULT_TEXT_SIZE;
}

function applyTextSizePreference(mode) {
    const normalized = normalizeTextSizeValue(mode);
    document.body.classList.toggle("large-text-mode", normalized === "large");
    document.documentElement.setAttribute("data-text-size", normalized);
}

window.setTextSizePreference = function(mode) {
    localStorage.setItem(TEXT_SIZE_KEY, mode);
    applyTextSizePreference(mode);
};

/**
 * TRANSLATION LOGIC
 */

function getTextNodes(root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        const text = node.nodeValue.trim();
        if (!text) return NodeFilter.FILTER_REJECT;
        if (text.length < 2) return NodeFilter.FILTER_REJECT;
        if (/^\d+$/.test(text)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  let current;
  while ((current = walker.nextNode())) {
    nodes.push(current);
  }
  return nodes;
}


async function translatePage(targetLang) {
  if (translationInProgress) return;
  translationInProgress = true;
  const indicator = document.createElement('div');
  indicator.style.position = 'fixed';
  indicator.style.top = '50%';
  indicator.style.left = '50%';
  indicator.style.transform = 'translate(-50%, -50%)';
  indicator.style.background = 'rgba(0,0,0,0.8)';
  indicator.style.color = 'white';
  indicator.style.padding = '20px';
  indicator.style.borderRadius = '10px';
  indicator.style.zIndex = '9999';
  indicator.textContent = 'Translating page, please wait...';
  document.body.appendChild(indicator);


  console.log("Text nodes found:", getTextNodes(document.body).length);
  console.log(`Translating page to ${targetLang}...`);

  const apiURL = "https://fsdp-cycling-ltey.onrender.com/translate";
  const textNodes = getTextNodes(document.body);

  for (const node of textNodes) {
    const originalText = node.nodeValue.trim();
    if (!originalText) continue;

    const cached = getCachedTranslation(targetLang, originalText);
    if (cached) {
      node.nodeValue = cached;
      continue;
    }

    try {
      const res = await fetch(apiURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: originalText,
          source: "auto",
          target: targetLang
        })
      });

      const data = await res.json();
      if (!data?.translatedText) continue;

      node.nodeValue = data.translatedText;
      saveTranslationToCache(targetLang, originalText, data.translatedText);

      await new Promise(r => setTimeout(r, 120));

    } catch (e) {
      console.error("Translate failed:", e);
    }
  }

  translationInProgress = false;
}


function getCachedTranslation(lang, text) {
    const cache = JSON.parse(localStorage.getItem("translationCache") || "{}");
    return cache[lang]?.[text] || null;
}

function saveTranslationToCache(lang, original, translated) {
    const cache = JSON.parse(localStorage.getItem("translationCache") || "{}");
    if (!cache[lang]) cache[lang] = {};
    cache[lang][original] = translated;
    localStorage.setItem("translationCache", JSON.stringify(cache));
}

window.translatePage = translatePage;
window.changeLanguage = function(lang) {
  localStorage.setItem("targetLanguage", lang);
    if (translationInProgress) {
        console.warn("Translation already in progress...");
        return;
    }
    // Clear cache when manually switching to ensure fresh results
    localStorage.removeItem("translationCache");
    translatePage(lang);
};

/**
 * INITIALIZATION
 */
document.addEventListener("DOMContentLoaded", () => {
    // Apply text size
    const savedSize = localStorage.getItem(TEXT_SIZE_KEY) || DEFAULT_TEXT_SIZE;
    applyTextSizePreference(savedSize);

    // Auto-translate if language is saved
    const savedLang = localStorage.getItem("targetLanguage");
    if (savedLang) {
        translatePage(savedLang);
    }
});

