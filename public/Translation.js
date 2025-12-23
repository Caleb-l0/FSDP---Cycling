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
    if (translationInProgress) {
        console.warn("Translation already in progress...");
        return;
    }
    translationInProgress = true;

    console.log(`Translating page to ${targetLang}...`);

    const apiURL = "https://fsdp-cycling-ltey.onrender.com/translate";
    const textNodes = getTextNodes(document.body);
    console.log("Text nodes found:", textNodes.length);

    // Show loading indicator
    const indicator = document.createElement("div");
    indicator.id = "translation-indicator";
    indicator.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.85); color: white; padding: 20px 40px;
        border-radius: 12px; font-size: 18px; z-index: 9999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    indicator.textContent = "Translating page... Please wait";
    document.body.appendChild(indicator);

    const batchSize = 5;  // Safe concurrency for Render free tier

    for (let i = 0; i < textNodes.length; i += batchSize) {
        const batch = textNodes.slice(i, i + batchSize);

        await Promise.all(batch.map(async (node) => {
            const originalText = node.nodeValue.trim();
            if (!originalText) return;

            const cached = getCachedTranslation(targetLang, originalText);
            if (cached) {
                node.nodeValue = cached;
                return;
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
                const translated = data?.translatedText || originalText;
                node.nodeValue = translated;
                saveTranslationToCache(targetLang, originalText, translated);

            } catch (e) {
                console.error("Translation failed for text:", originalText, e);
                // Keep original on error
            }
        }));

        // Small delay between batches to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
    }

    // Remove loading indicator
    if (document.getElementById("translation-indicator")) {
        document.body.removeChild(indicator);
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

window.changeLanguage = function(lang) {
    localStorage.setItem("targetLanguage", lang);  // Remember choice
    if (translationInProgress) {
        console.warn("Translation already in progress...");
        return;
    }
    localStorage.removeItem("translationCache");  // Clear cache for fresh translation
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
    if (savedLang && savedLang !== "en") {  // Assuming "en" is default/original
        translatePage(savedLang);
    }
});