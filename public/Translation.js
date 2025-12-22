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

// 优化的翻译函数
async function translatePage(targetLang) {
    if (translationInProgress) {
        console.log("Translation in progress. Please wait for it to finish.");
        return;
    }

    if (translateController) translateController.abort();
    translateController = new AbortController();
    const signal = translateController.signal;

    translationInProgress = true;

    const apiURL = "https://fsdp-cycling-ltey.onrender.com/translate";
    localStorage.setItem("targetLanguage", targetLang);

    try {
        // 1. 先翻译所有文本节点
        await translateTextNodes(targetLang, signal);
        
        // 2. 翻译占位符和按钮文本
        await translateAttributes(targetLang, signal);
        
        console.log(`✅ Translation to ${targetLang} completed`);
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error("Translation error:", error);
        }
    } finally {
        translationInProgress = false;
    }
}

// 翻译文本节点（更智能的选择）
async function translateTextNodes(targetLang, signal) {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // 过滤掉script、style等标签内的文本
                if (node.parentElement.tagName === 'SCRIPT' || 
                    node.parentElement.tagName === 'STYLE' ||
                    node.parentElement.tagName === 'NOSCRIPT') {
                    return NodeFilter.FILTER_REJECT;
                }
                
                const text = node.textContent.trim();
                if (!text || text.length < 2) return NodeFilter.FILTER_REJECT;
                
                // 跳过已经是翻译过的内容（可选的检查）
                return NodeFilter.FILTER_ACCEPT;
            }
        },
        false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }

    console.log(`Found ${textNodes.length} text nodes to translate`);

    // 分批处理，避免过多请求
    const batchSize = 10;
    for (let i = 0; i < textNodes.length; i += batchSize) {
        if (signal.aborted) break;
        
        const batch = textNodes.slice(i, i + batchSize);
        await Promise.all(
            batch.map(async (textNode) => {
                try {
                    await translateSingleTextNode(textNode, targetLang, signal);
                } catch (error) {
                    console.warn("Failed to translate node:", error);
                }
            })
        );
    }
}

async function translateSingleTextNode(textNode, targetLang, signal) {
    const originalText = textNode.textContent.trim();
    if (!originalText) return;
    
    // 跳过数字、符号、链接等
    if (/^\d+$/.test(originalText) || 
        /^[^a-zA-Z]+$/.test(originalText) ||
        originalText.startsWith('http') ||
        originalText.includes('@')) {
        return;
    }
    
    // 检查缓存
    const cached = getCachedTranslation(targetLang, originalText);
    if (cached) {
        textNode.textContent = textNode.textContent.replace(originalText, cached);
        return;
    }
    
    try {
        const response = await fetch("https://fsdp-cycling-ltey.onrender.com/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                q: originalText, 
                from: "auto", 
                to: targetLang 
            }),
            signal
        });
        
        const data = await response.json();
        if (data && data.translatedText) {
            textNode.textContent = textNode.textContent.replace(originalText, data.translatedText);
            saveTranslationToCache(targetLang, originalText, data.translatedText);
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            throw error;
        }
    }
}

// 翻译属性（placeholder, title, alt等）
async function translateAttributes(targetLang, signal) {
    const attributesToTranslate = ['placeholder', 'title', 'alt', 'aria-label'];
    const elements = document.querySelectorAll('*');
    
    for (const el of elements) {
        if (signal.aborted) break;
        
        for (const attr of attributesToTranslate) {
            const value = el.getAttribute(attr);
            if (value && value.trim()) {
                try {
                    const translated = await translateText(value.trim(), targetLang, signal);
                    if (translated) {
                        el.setAttribute(attr, translated);
                    }
                } catch (error) {
                    // 忽略单条翻译失败
                }
            }
        }
    }
}

async function translateText(text, targetLang, signal) {
    // 检查缓存
    const cached = getCachedTranslation(targetLang, text);
    if (cached) return cached;
    
    try {
        const response = await fetch("https://fsdp-cycling-ltey.onrender.com/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                q: text, 
                from: "auto", 
                to: targetLang 
            }),
            signal
        });
        
        const data = await response.json();
        if (data && data.translatedText) {
            saveTranslationToCache(targetLang, text, data.translatedText);
            return data.translatedText;
        }
    } catch (error) {
        // 返回原文本
        return text;
    }
    
    return text;
}

function getCachedTranslation(lang, text) {
    try {
        const cache = JSON.parse(localStorage.getItem("translationCache") || "{}");
        if (cache[lang] && cache[lang][text]) {
            return cache[lang][text];
        }
    } catch (error) {
        console.warn("Translation cache read error:", error);
    }
    return null;
}

function saveTranslationToCache(lang, original, translated) {
    try {
        let cache = JSON.parse(localStorage.getItem("translationCache") || "{}");
        if (!cache[lang]) cache[lang] = {};
        cache[lang][original] = translated;
        localStorage.setItem("translationCache", JSON.stringify(cache));
    } catch (error) {
        console.warn("Translation cache save error:", error);
    }
}

function changeLanguage(newLang) {
    if (translationInProgress) {
        alert("Translation in progress. Please wait before changing language.");
        return;
    }
    
    localStorage.setItem("targetLanguage", newLang);
    
    // 重新加载页面以应用翻译（更可靠的方法）
    window.location.reload();
}

// 简化的翻译函数（更高效）
async function translatePageSimple(targetLang) {
    if (translationInProgress) return;
    
    translationInProgress = true;
    localStorage.setItem("targetLanguage", targetLang);
    
    try {
        // 只翻译主要的可见文本
        const elementsToTranslate = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'span', 'div', 'a', 'button',
            'label', 'th', 'td', 'li'
        ];
        
        const selector = elementsToTranslate.join(', ');
        const elements = document.querySelectorAll(selector);
        
        for (const el of elements) {
            const originalText = el.textContent.trim();
            if (!originalText || originalText.length < 2) continue;
            
            // 跳过某些元素
            if (el.classList.contains('no-translate') || 
                el.hasAttribute('data-no-translate')) {
                continue;
            }
            
            const cached = getCachedTranslation(targetLang, originalText);
            if (cached) {
                el.textContent = cached;
                continue;
            }
            
            try {
                const response = await fetch("https://fsdp-cycling-ltey.onrender.com/translate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        q: originalText, 
                        from: "auto", 
                        to: targetLang 
                    })
                });
                
                const data = await response.json();
                if (data && data.translatedText) {
                    el.textContent = data.translatedText;
                    saveTranslationToCache(targetLang, originalText, data.translatedText);
                }
            } catch (error) {
                console.warn("Translation failed for:", originalText, error);
            }
            
            // 防止过快请求
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log(`✅ Translated ${elements.length} elements to ${targetLang}`);
    } catch (error) {
        console.error("Translation error:", error);
    } finally {
        translationInProgress = false;
    }
}

// DOM加载完成后的初始化
document.addEventListener("DOMContentLoaded", function () {
    // 应用文本大小
    applyTextSizePreference(getTextSizePreference());
    
    // 检查是否需要翻译
    const lang = localStorage.getItem("targetLanguage");
    if (lang && lang !== 'en') {
        // 延迟一点执行，确保页面完全加载
        setTimeout(() => {
            translatePageSimple(lang);
        }, 500);
    }
    
    // 添加语言切换按钮事件监听
    document.querySelectorAll('[data-lang]').forEach(btn => {
        btn.addEventListener('click', function() {
            const newLang = this.getAttribute('data-lang');
            changeLanguage(newLang);
        });
    });
});

// 导出函数供全局使用
window.translatePage = translatePageSimple;
window.changeLanguage = changeLanguage;