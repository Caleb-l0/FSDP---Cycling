console.log("Translation.js LOADED");

const TEXT_SIZE_KEY = "happyVolunteerTextSize";
const DEFAULT_TEXT_SIZE = "normal";
let translationInProgress = false;

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

function getTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
            const text = node.nodeValue.trim();
            if (!text || text.length < 2 || /^\d+$/.test(text)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });

    const nodes = [];
    let current;
    while ((current = walker.nextNode())) nodes.push(current);
    return nodes;
}

async function translatePage(targetLang) {
    if (translationInProgress) return;
    translationInProgress = true;

    console.log(`Translating to ${targetLang}...`);

    const apiURL = "https://fsdp-cycling-ltey.onrender.com/translate";
    const textNodes = getTextNodes(document.body);

    const indicator = document.createElement("div");
    indicator.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:white;padding:20px 40px;border-radius:12px;font-size:18px;z-index:9999;";
    indicator.textContent = "Translating... Please wait";
    document.body.appendChild(indicator);

    const textsToTranslate = [];
    const nodesToUpdate = [];

    textNodes.forEach(node => {
        const original = node.nodeValue.trim();
        if (!original) return;

        const cached = getCachedTranslation(targetLang, original);
        if (cached) {
            node.nodeValue = cached;
        } else {
            textsToTranslate.push(original);
            nodesToUpdate.push(node);
        }
    });

    if (textsToTranslate.length > 0) {
        try {
            const res = await fetch(apiURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    q: textsToTranslate,
                    source: "auto",
                    target: targetLang
                })
            });

            const data = await res.json();
            console.log("Backend response:", data);  // 关键日志，看这个！

            let translatedArray = [];

            if (data.translatedTexts && Array.isArray(data.translatedTexts)) {
                translatedArray = data.translatedTexts;
            } else if (data.translatedText) {
                translatedArray = Array.isArray(data.translatedText) ? data.translatedText : [data.translatedText];
            } else {
                translatedArray = textsToTranslate;  // fallback
            }

            // 确保长度匹配
            if (translatedArray.length < textsToTranslate.length) {
                translatedArray = translatedArray.concat(textsToTranslate.slice(translatedArray.length));
            }

            nodesToUpdate.forEach((node, i) => {
                const translated = translatedArray[i] || textsToTranslate[i];
                node.nodeValue = translated;
                saveTranslationToCache(targetLang, textsToTranslate[i], translated);
            });

        } catch (e) {
            console.error("Translation request failed:", e);
        }
    }

    document.body.removeChild(indicator);
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
    localStorage.setItem("targetLanguage", lang);
    localStorage.removeItem("translationCache");
    translatePage(lang);
};

document.addEventListener("DOMContentLoaded", () => {
    const savedSize = localStorage.getItem(TEXT_SIZE_KEY) || DEFAULT_TEXT_SIZE;
    applyTextSizePreference(savedSize);

    const savedLang = localStorage.getItem("targetLanguage");
    if (savedLang && savedLang !== "en") translatePage(savedLang);
});