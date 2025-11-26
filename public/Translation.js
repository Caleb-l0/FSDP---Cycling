let translateController = null;
let translationInProgress = false;

async function translatePage(targetLang) {
    if (translationInProgress) {
        alert("Translation in progress. Please wait for it to finish.");
        return;
    }

    if (translateController) translateController.abort();
    translateController = new AbortController();
    const signal = translateController.signal;

    translationInProgress = true;

    const apiURL = "http://localhost:3000/translate";
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
    const lang = localStorage.getItem("targetLanguage");
    if (lang) translatePage(lang);
});
