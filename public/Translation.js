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

    const textNodes = getTextNodes(document.body);

    const indicator = document.createElement("div");
    indicator.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:white;padding:20px 40px;border-radius:12px;font-size:18px;z-index:9999;";
    indicator.textContent = "Translating... Please wait";
    document.body.appendChild(indicator);

    const textsToTranslate = [];
    const nodesToUpdate = [];
    const originalTexts = [];

    textNodes.forEach(node => {
        const original = node.nodeValue.trim();
        if (!original) return;

        const cached = getCachedTranslation(targetLang, original);
        if (cached) {
            node.nodeValue = cached;
        } else {
            originalTexts.push(original);
            textsToTranslate.push(original);
            nodesToUpdate.push(node);
        }
    });

    // 逐个翻译（MyMemory 不支持批量数组，所以安全循环）
    for (let i = 0; i < textsToTranslate.length; i++) {
        const text = textsToTranslate[i];

        try {
            const encoded = encodeURIComponent(text);
            const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|${targetLang}`;

            const res = await fetch(url);
            const data = await res.json();

            let translated = text; // 默认原文字

            if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                translated = data.responseData.translatedText;
            }

            nodesToUpdate[i].nodeValue = translated;
            saveTranslationToCache(targetLang, text, translated);

        } catch (e) {
            console.error("Translate failed for:", text, e);
            // 出错保留原文字
        }

        // 可选：加小延迟避免触发限流
        // await new Promise(r => setTimeout(r, 100));
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
    localStorage.removeItem("translationCache"); // 切换语言时清缓存
    translatePage(lang);
};

document.addEventListener("DOMContentLoaded", () => {
    const savedSize = localStorage.getItem(TEXT_SIZE_KEY) || DEFAULT_TEXT_SIZE;
    applyTextSizePreference(savedSize);

    const savedLang = localStorage.getItem("targetLanguage");
    if (savedLang && savedLang !== "en") {
        translatePage(savedLang);
    }
});
