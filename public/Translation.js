let translateController = null;
let translationInProgress = false;
const TEXT_SIZE_KEY = "happyVolunteerTextSize";
const DEFAULT_TEXT_SIZE = "normal";

function normalizeTextSizeValue(value) {
    if (typeof value !== "string") return DEFAULT_TEXT_SIZE;
    return value === "large" ? "large" : "normal";
}

function getTextSizePreference() {
    try {
        return normalizeTextSizeValue(localStorage.getItem(TEXT_SIZE_KEY));
    } catch (error) {
        console.warn("Text size preference read blocked:", error);
        return DEFAULT_TEXT_SIZE;
    }
}

function applyTextSizePreference(mode) {
    const normalized = normalizeTextSizeValue(mode);
    if (typeof document !== "undefined") {
        if (document.body) {
            document.body.classList.toggle("large-text-mode", normalized === "large");
        }
        document.documentElement.style.fontSize = normalized === "large" ? "115%" : "";
        document.documentElement.setAttribute("data-text-size", normalized);
    }
    return normalized;
}

function setTextSizePreference(mode) {
    const normalized = applyTextSizePreference(mode);
    try {
        localStorage.setItem(TEXT_SIZE_KEY, normalized);
    } catch (error) {
        console.warn("Text size preference save blocked:", error);
    }
    return normalized;
}

window.textSizeController = {
    get: getTextSizePreference,
    set: setTextSizePreference,
    apply: applyTextSizePreference
};

window.setTextSizePreference = setTextSizePreference;
window.getTextSizePreference = getTextSizePreference;

async function translatePage(targetLang) {
    if (translationInProgress) {
        alert("Translation in progress. Please wait for it to finish.");
        return;
    }
    else{
    alert("Translation in progress, please wait for 1 minutes")
    if (translateController) translateController.abort();
    translateController = new AbortController();
    const signal = translateController.signal;

    translationInProgress = true;

    const apiURL = "https://fsdp-cycling-ltey.onrender.com/translate";
    localStorage.setItem("targetLanguage", targetLang);

    const elements = document.querySelectorAll("*");

    for (const el of elements) {
        if (signal.aborted) {
            translationInProgress = false;
            return;
        }

        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
            const originalText = el.innerText.trim();
            if (!originalText) continue;

            const cached = getCachedTranslation(targetLang, originalText);
            if (cached) {
                el.innerText = cached;
                continue;
            }

            let response;
            try {
                response = await fetch(apiURL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ q: originalText, from: "auto", to: targetLang }),
                    signal
                });
            } catch (e) {
                translationInProgress = false;
                return;
            }

            const data = await response.json();
            if (!data || !data.translatedText) continue;

            el.innerText = data.translatedText;

            saveTranslationToCache(targetLang, originalText, data.translatedText);
        }
    }

    translationInProgress = false;
}
}

function getCachedTranslation(lang, text) {
    const cache = JSON.parse(localStorage.getItem("translationCache") || "{}");
    if (cache[lang] && cache[lang][text]) return cache[lang][text];
    return null;
}

function saveTranslationToCache(lang, original, translated) {
    let cache = JSON.parse(localStorage.getItem("translationCache") || "{}");
    if (!cache[lang]) cache[lang] = {};
    cache[lang][original] = translated;
    localStorage.setItem("translationCache", JSON.stringify(cache));
}

function changeLanguage(newLang) {
    if (translationInProgress) {
        alert("Translation in progress. Please wait before changing language.");
        return;
    }
    localStorage.setItem("targetLanguage", newLang);
    localStorage.removeItem("translationCache");
    translatePage(newLang);
}

document.addEventListener("DOMContentLoaded", function () {
    applyTextSizePreference(getTextSizePreference());
    const lang = localStorage.getItem("targetLanguage");
    if (lang) translatePage(lang);
});
