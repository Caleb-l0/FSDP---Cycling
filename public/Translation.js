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
async function translatePage(targetLang) {
    if (translationInProgress || !targetLang) return;

    translationInProgress = true;
    localStorage.setItem("targetLanguage", targetLang);

    const apiURL = "https://fsdp-cycling-ltey.onrender.com/translate";
    
    // Select elements but filter out those that are empty or just whitespace
    const elements = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,span,a,button,label,li,th,td"))
                          .filter(el => el.textContent.trim().length > 0);

    console.log(`Translating ${elements.length} elements to: ${targetLang}`);

    // Process all elements concurrently using Promise.allSettled
    await Promise.allSettled(elements.map(async (el) => {
        const originalText = el.textContent.trim();
        
        // Check local cache first
        const cached = getCachedTranslation(targetLang, originalText);
        if (cached) {
            el.textContent = cached;
            return;
        }

        try {
            const response = await fetch(apiURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    q: originalText,
                    from: "auto",
                    to: targetLang
                })
            });

            if (!response.ok) return;

            const data = await response.json();
            if (data?.translatedText) {
                el.textContent = data.translatedText;
                saveTranslationToCache(targetLang, originalText, data.translatedText);
            }
        } catch (err) {
            console.error("Translation error for element:", originalText, err);
        }
    }));

    translationInProgress = false;
    console.log("Translation complete.");
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

window.changeLanguage = function(lang) {
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