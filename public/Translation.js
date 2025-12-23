
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
    console.log("translatePage STARTED for:", targetLang);

    if (translationInProgress) {
        console.warn("Already translating, ignoring...");
        return;
    }
    translationInProgress = true;

    
    let indicator = document.getElementById("debug-indicator");
    if (!indicator) {
        indicator = document.createElement("div");
        indicator.id = "debug-indicator";
        indicator.style.cssText = "position:fixed;top:10px;left:10px;background:red;color:white;padding:10px;z-index:9999;font-size:14px;";
        document.body.appendChild(indicator);
    }
    indicator.textContent = `正在翻译到 ${targetLang}...`;

    const apiURL = "https://fsdp-cycling-ltey.onrender.com/translate";
    console.log("API URL:", apiURL);

    try {
        
        console.log("Sending request with body:", JSON.stringify({
            q: ["Test hello world"],
            source: "auto",
            target: targetLang
        }));

        const res = await fetch(apiURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                q: ["Hello world", "Welcome"],  
                source: "auto",
                target: targetLang
            })
        });

        console.log("Fetch response status:", res.status);
        console.log("Fetch response ok:", res.ok);

        const data = await res.json();
        console.log("Backend returned data:", data);

        if (data.translatedTexts) {
            console.log("Batch success:", data.translatedTexts);
            indicator.textContent = "翻译成功！示例：" + data.translatedTexts[0];
        } else if (data.translatedText) {
            console.log("Single success:", data.translatedText);
            indicator.textContent = "翻译成功！示例：" + data.translatedText;
        } else {
            console.log("No translation returned");
            indicator.textContent = "后端没返回翻译文本";
        }

    } catch (e) {
        console.error("Fetch completely failed:", e);
        indicator.textContent = "请求失败：" + e.message;
    }

    translationInProgress = false;
}

window.changeLanguage = function(lang) {
    console.log("changeLanguage called:", lang);
    translatePage(lang);
};


document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded");
});

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
    if (translationInProgress) {
        console.warn("Translation already in progress...");
        return;
    }
    localStorage.removeItem("translationCache");  // Clear cache when switching language
    translatePage(lang);
};

/**
 * INITIALIZATION
 */
document.addEventListener("DOMContentLoaded", () => {
    const savedSize = localStorage.getItem(TEXT_SIZE_KEY) || DEFAULT_TEXT_SIZE;
    applyTextSizePreference(savedSize);

    const savedLang = localStorage.getItem("targetLanguage");
    if (savedLang && savedLang !== "en") {
        translatePage(savedLang);
    }
});