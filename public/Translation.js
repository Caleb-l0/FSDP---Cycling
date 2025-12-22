/**
 * LibreTranslate Multi-language Translation System
 * Features:
 * 1. Click to translate page content
 * 2. Support 100+ languages
 * 3. Translation progress indication
 * 4. Translation interrupt and switch
 * 5. Language preference caching
 */

class LibreTranslator {
    constructor(options = {}) {
        // Configuration
        this.config = {
           apiUrl: options.apiUrl || '/translate/batch',
            cacheDuration: 30 * 24 * 60 * 60 * 1000, // 30 days cache
            maxTextLength: 5000, // Max length per translation
            batchSize: 10, // Batch translation size
            requestDelay: 100, // Request delay (ms)
            maxCacheSize: 1000, // Max cache entries
            ...options
        };

        // State
        this.isTranslating = false;
        this.currentLang = null;
        this.abortController = null;
        this.progressElement = null;
        this.cache = new Map();
        this.translationQueue = [];
        this.activeRequests = new Set();

        // Supported languages with codes and display names
        this.supportedLanguages = {
            'en': { name: 'English', native: 'English' },
            'zh': { name: 'Chinese', native: '中文' },
            'zh-CN': { name: 'Chinese (Simplified)', native: '简体中文' },
            'zh-TW': { name: 'Chinese (Traditional)', native: '繁體中文' },
            'ms': { name: 'Malay', native: 'Bahasa Melayu' },
            'ta': { name: 'Tamil', native: 'தமிழ்' },
            'ja': { name: 'Japanese', native: '日本語' },
            'ko': { name: 'Korean', native: '한국어' },
            'fr': { name: 'French', native: 'Français' },
            'de': { name: 'German', native: 'Deutsch' },
            'es': { name: 'Spanish', native: 'Español' },
            'ru': { name: 'Russian', native: 'Русский' },
            'ar': { name: 'Arabic', native: 'العربية' },
            'hi': { name: 'Hindi', native: 'हिन्दी' },
            'pt': { name: 'Portuguese', native: 'Português' },
            'it': { name: 'Italian', native: 'Italiano' },
            'nl': { name: 'Dutch', native: 'Nederlands' },
            'pl': { name: 'Polish', native: 'Polski' },
            'tr': { name: 'Turkish', native: 'Türkçe' },
            'vi': { name: 'Vietnamese', native: 'Tiếng Việt' },
            'th': { name: 'Thai', native: 'ไทย' },
            'id': { name: 'Indonesian', native: 'Bahasa Indonesia' }
        };

        // Initialize
        this.loadCacheFromStorage();
        this.setupLanguageDetection();
    }

    // ========================
    // CACHE MANAGEMENT
    // ========================
    
    /**
     * Generate cache key
     */
    generateCacheKey(text, targetLang) {
        const normalizedText = text.trim().toLowerCase();
        const hash = this.hashString(normalizedText + targetLang);
        return `${this.config.cachePrefix}${hash}`;
    }

    /**
     * String hash function
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Get translation from cache
     */
    getFromCache(text, targetLang) {
        const cacheKey = this.generateCacheKey(text, targetLang);
        
        // Check memory cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() < cached.expiry) {
                return { text: cached.text, source: 'memory' };
            } else {
                this.cache.delete(cacheKey);
            }
        }

        // Check localStorage
        try {
            const stored = localStorage.getItem(cacheKey);
            if (stored) {
                const cached = JSON.parse(stored);
                if (Date.now() < cached.expiry) {
                    this.cache.set(cacheKey, cached);
                    return { text: cached.text, source: 'storage' };
                } else {
                    localStorage.removeItem(cacheKey);
                }
            }
        } catch (error) {
            console.warn('Cache read error:', error);
        }

        return null;
    }

    /**
     * Save translation to cache
     */
    saveToCache(text, targetLang, translatedText) {
        const cacheKey = this.generateCacheKey(text, targetLang);
        const cacheItem = {
            text: translatedText,
            original: text,
            lang: targetLang,
            expiry: Date.now() + this.config.cacheDuration,
            timestamp: Date.now()
        };

        // Save to memory
        this.cache.set(cacheKey, cacheItem);

        // Save to localStorage with size limit
        try {
            // Check cache size
            const cacheKeys = Object.keys(localStorage)
                .filter(key => key.startsWith(this.config.cachePrefix));
            
            if (cacheKeys.length >= this.config.maxCacheSize) {
                // Remove oldest cache entries
                const oldestKeys = cacheKeys
                    .map(key => ({ key, item: JSON.parse(localStorage.getItem(key)) }))
                    .filter(item => item.item)
                    .sort((a, b) => a.item.timestamp - b.item.timestamp)
                    .slice(0, 10)
                    .map(item => item.key);
                
                oldestKeys.forEach(key => {
                    localStorage.removeItem(key);
                    this.cache.delete(key);
                });
            }
            
            localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('Cache save error:', error);
        }
    }

    /**
     * Load cache from storage
     */
    loadCacheFromStorage() {
        try {
            const keys = Object.keys(localStorage);
            const prefix = this.config.cachePrefix;
            let loadedCount = 0;
            
            keys.forEach(key => {
                if (key.startsWith(prefix)) {
                    try {
                        const cached = JSON.parse(localStorage.getItem(key));
                        if (cached && Date.now() < cached.expiry) {
                            this.cache.set(key, cached);
                            loadedCount++;
                        } else {
                            localStorage.removeItem(key);
                        }
                    } catch (error) {
                        localStorage.removeItem(key);
                    }
                }
            });
            
            console.log(`Loaded ${loadedCount} cached translations`);
        } catch (error) {
            console.warn('Cache load error:', error);
        }
    }

    /**
     * Clear all cache
     */
    clearAllCache() {
        try {
            const keys = Object.keys(localStorage);
            const prefix = this.config.cachePrefix;
            let clearedCount = 0;
            
            keys.forEach(key => {
                if (key.startsWith(prefix)) {
                    localStorage.removeItem(key);
                    clearedCount++;
                }
            });
            
            this.cache.clear();
            console.log(`Cleared ${clearedCount} cache entries`);
            return clearedCount;
        } catch (error) {
            console.warn('Clear cache error:', error);
            return 0;
        }
    }

    // ========================
    // TRANSLATION FUNCTIONS
    // ========================
    
    /**
     * Translate single text
     */
    async translateText(text, targetLang, sourceLang = 'auto') {
        // Check cache first
        const cached = this.getFromCache(text, targetLang);
        if (cached) {
            console.log(`Cache hit for: "${text.substring(0, 30)}..."`);
            return cached.text;
        }

        // Validate text
        if (!text || text.trim().length === 0) {
            return text;
        }

        // Truncate if too long
        if (text.length > this.config.maxTextLength) {
            console.warn(`Text too long (${text.length} chars), truncating`);
            text = text.substring(0, this.config.maxTextLength) + '...';
        }

        // Create request promise
        const requestPromise = (async () => {
            try {
                const response = await fetch(this.config.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        q: text,
                        source: sourceLang,
                        target: targetLang,
                        format: 'text',
                       
                    }),
                    signal: this.abortController?.signal
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                
                if (!data || !data.translatedText) {
                    throw new Error('Invalid response format');
                }

                // Save to cache
                this.saveToCache(text, targetLang, data.translatedText);
                
                return data.translatedText;

            } catch (error) {
                if (error.name === 'AbortError') {
                    throw error; // Re-throw abort errors
                }
                
                console.error(`Translation failed for "${text.substring(0, 30)}...":`, error);
                
                // Fallback: return original with language tag
                return `[${targetLang.toUpperCase()}] ${text}`;
            }
        })();

        // Store request for potential cancellation
        this.activeRequests.add(requestPromise);
        
        try {
            const result = await requestPromise;
            return result;
        } finally {
            this.activeRequests.delete(requestPromise);
        }
    }

    /**
     * Batch translate texts
     */
    async translateBatch(texts, targetLang, sourceLang = 'auto') {
        if (!texts || texts.length === 0) return [];
        
        const results = new Array(texts.length);
        
        // Process in batches
        for (let i = 0; i < texts.length; i += this.config.batchSize) {
            // Check if translation was aborted
            if (this.abortController?.signal.aborted) {
                throw new DOMException('Translation aborted', 'AbortError');
            }
            
            const batch = texts.slice(i, i + this.config.batchSize);
            const batchPromises = batch.map((text, index) => 
                this.translateText(text, targetLang, sourceLang)
                    .then(result => ({ index: i + index, result }))
                    .catch(error => ({ index: i + index, error }))
            );
            
            const batchResults = await Promise.all(batchPromises);
            
            // Process batch results
            batchResults.forEach(({ index, result, error }) => {
                if (error) {
                    results[index] = texts[index]; // Fallback to original
                } else {
                    results[index] = result;
                }
            });
            
            // Update progress
            if (this.progressElement) {
                const progress = Math.min(i + batch.length, texts.length);
                const total = texts.length;
                this.progressElement.textContent = `Translating... ${progress}/${total}`;
            }
            
            // Delay between batches
            if (i + this.config.batchSize < texts.length) {
                await this.delay(this.config.requestDelay);
            }
        }
        
        return results;
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================
    // PAGE TRANSLATION
    // ========================
    
    /**
     * Collect all text elements from page
     */
    collectTextElements() {
        const elements = [];
        const seenTexts = new Set();
        
        // Selectors for elements to translate
        const selectors = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'span', 'a', 'button',
            'label', 'th', 'td', 'li',
            '.title', '.subtitle', '.content',
            '.hero-content', '.section-title',
            '.service-content', '.card-title',
            '.card-text', '.btn-text',
            'nav a', 'footer a', 'footer p'
        ].join(', ');
        
        try {
            document.querySelectorAll(selectors).forEach(element => {
                // Skip elements that shouldn't be translated
                if (this.shouldSkipElement(element)) return;
                
                const text = element.textContent.trim();
                
                // Filter criteria
                if (text && 
                    text.length > 1 && 
                    !/^\d+$/.test(text) && // Not pure numbers
                    !text.startsWith('http') && // Not URLs
                    !text.includes('@') && // Not emails
                    !seenTexts.has(text)) {
                    
                    seenTexts.add(text);
                    elements.push({
                        element: element,
                        text: text,
                        originalHTML: element.innerHTML,
                        isInput: element.tagName === 'INPUT' || element.tagName === 'TEXTAREA'
                    });
                }
            });
        } catch (error) {
            console.error('Error collecting text elements:', error);
        }
        
        return elements;
    }

    /**
     * Check if element should be skipped
     */
    shouldSkipElement(element) {
        const tagName = element.tagName.toLowerCase();
        const className = element.className || '';
        
        // Skip script, style, code elements
        if (['script', 'style', 'noscript', 'code', 'pre'].includes(tagName)) {
            return true;
        }
        
        // Skip icon elements
        if (className.includes('icon') || 
            className.includes('fa-') || 
            className.includes('material-icons')) {
            return true;
        }
        
        // Skip hidden elements
        if (element.offsetParent === null && 
            window.getComputedStyle(element).display === 'none') {
            return true;
        }
        
        // Skip input elements (they have value, not textContent)
        if (['input', 'textarea', 'select', 'option'].includes(tagName)) {
            return true;
        }
        
        // Skip elements with no-translate class or attribute
        if (className.includes('no-translate') || 
            element.hasAttribute('data-no-translate')) {
            return true;
        }
        
        return false;
    }

    /**
     * Create progress indicator
     */
    createProgressIndicator() {
        // Remove existing progress element
        const existing = document.getElementById('libre-translate-progress');
        if (existing) existing.remove();
        
        // Create new progress element
        const el = document.createElement('div');
        el.id = 'libre-translate-progress';
        el.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            font-size: 14px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        // Add spinner
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        `;
        
        el.appendChild(spinner);
        
        // Add text
        const text = document.createElement('span');
        text.textContent = 'Starting translation...';
        el.appendChild(text);
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            margin-left: 8px;
            padding: 0 4px;
        `;
        closeBtn.onclick = () => this.abortTranslation();
        el.appendChild(closeBtn);
        
        document.body.appendChild(el);
        
        // Add spinner animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        return el;
    }

    /**
     * Update progress indicator
     */
    updateProgress(text, type = 'info') {
        if (!this.progressElement) return;
        
        const textElement = this.progressElement.querySelector('span');
        if (textElement) {
            textElement.textContent = text;
        }
        
        // Change color based on type
        if (type === 'success') {
            this.progressElement.style.background = 'linear-gradient(135deg, #34a853, #0f9d58)';
        } else if (type === 'error') {
            this.progressElement.style.background = 'linear-gradient(135deg, #ea4335, #d93025)';
        } else if (type === 'warning') {
            this.progressElement.style.background = 'linear-gradient(135deg, #fbbc05, #f9ab00)';
        }
    }

    /**
     * Remove progress indicator
     */
    removeProgressIndicator() {
        if (this.progressElement) {
            this.progressElement.style.opacity = '0';
            this.progressElement.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                if (this.progressElement && this.progressElement.parentNode) {
                    this.progressElement.parentNode.removeChild(this.progressElement);
                }
                this.progressElement = null;
            }, 300);
        }
    }

    /**
     * Abort current translation
     */
    abortTranslation() {
        if (this.isTranslating) {
            console.log('Translation aborted by user');
            
            // Signal abort to all requests
            if (this.abortController) {
                this.abortController.abort();
            }
            
            // Clear all active requests
            this.activeRequests.clear();
            
            // Update state
            this.isTranslating = false;
            this.currentLang = null;
            
            // Update UI
            this.updateProgress('Translation cancelled', 'warning');
            setTimeout(() => this.removeProgressIndicator(), 1500);
        }
    }

    /**
     * Translate entire page
     */
    async translatePage(targetLang, sourceLang = 'auto') {
        // Check if already translating
        if (this.isTranslating) {
            const userConfirmed = confirm(
                'Translation is already in progress. Do you want to cancel and start new translation?'
            );
            
            if (userConfirmed) {
                this.abortTranslation();
                await this.delay(300); // Small delay for cleanup
            } else {
                return;
            }
        }
        
        try {
            // Set translation state
            this.isTranslating = true;
            this.currentLang = targetLang;
            this.abortController = new AbortController();
            
            // Show progress
            this.progressElement = this.createProgressIndicator();
            this.updateProgress('Preparing translation...');
            
            // Collect text elements
            const textElements = this.collectTextElements();
            console.log(`Found ${textElements.length} text elements to translate`);
            
            if (textElements.length === 0) {
                this.updateProgress('No text found to translate', 'warning');
                setTimeout(() => this.removeProgressIndicator(), 2000);
                this.isTranslating = false;
                return;
            }
            
            // Extract texts for batch translation
            const texts = textElements.map(item => item.text);
            
            // Perform batch translation
            this.updateProgress(`Translating ${textElements.length} items...`);
            
            const translatedTexts = await this.translateBatch(
                texts, 
                targetLang, 
                sourceLang
            );
            
            // Check if translation was aborted
            if (this.abortController.signal.aborted) {
                throw new DOMException('Translation aborted', 'AbortError');
            }
            
            // Apply translations to elements
            let successCount = 0;
            textElements.forEach((item, index) => {
                if (translatedTexts[index] && translatedTexts[index] !== item.text) {
                    item.element.textContent = translatedTexts[index];
                    successCount++;
                }
            });
            
            // Save language preference
            this.saveLanguagePreference(targetLang);
            
            // Update UI
            this.updateProgress(`✅ Translated ${successCount} items`, 'success');
            
            // Log completion
            console.log(`Translation completed: ${successCount}/${textElements.length} items translated to ${targetLang}`);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                this.updateProgress('Translation cancelled', 'warning');
            } else {
                console.error('Translation failed:', error);
                this.updateProgress('❌ Translation failed', 'error');
            }
        } finally {
            // Cleanup after delay
            setTimeout(() => {
                this.isTranslating = false;
                this.currentLang = null;
                this.abortController = null;
                this.removeProgressIndicator();
            }, 3000);
        }
    }

    // ========================
    // LANGUAGE MANAGEMENT
    // ========================
    
    /**
     * Save language preference
     */
    saveLanguagePreference(langCode) {
        try {
            const preference = {
                lang: langCode,
                timestamp: Date.now(),
                expiry: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
            };
            
            localStorage.setItem('libre_translate_preference', JSON.stringify(preference));
            console.log(`Saved language preference: ${langCode}`);
        } catch (error) {
            console.warn('Failed to save language preference:', error);
        }
    }

    /**
     * Get saved language preference
     */
    getLanguagePreference() {
        try {
            const stored = localStorage.getItem('libre_translate_preference');
            if (stored) {
                const preference = JSON.parse(stored);
                if (Date.now() < preference.expiry) {
                    return preference.lang;
                }
            }
        } catch (error) {
            console.warn('Failed to get language preference:', error);
        }
        return null;
    }

    /**
     * Clear language preference
     */
    clearLanguagePreference() {
        localStorage.removeItem('libre_translate_preference');
    }

    /**
     * Setup language detection
     */
    setupLanguageDetection() {
        // Detect browser language
        const browserLang = navigator.language || navigator.userLanguage;
        const savedLang = this.getLanguagePreference();
        
        // Use saved preference, then browser language, then default to English
        this.userPreferredLang = savedLang || browserLang.split('-')[0] || 'en';
        
        // Validate if language is supported
        if (!this.supportedLanguages[this.userPreferredLang]) {
            this.userPreferredLang = 'en'; // Fallback to English
        }
    }

    /**
     * Get language display name
     */
    getLanguageDisplayName(langCode, format = 'name') {
        const lang = this.supportedLanguages[langCode];
        if (!lang) return langCode.toUpperCase();
        
        return format === 'native' ? lang.native : lang.name;
    }

    /**
     * Get all supported languages
     */
    getSupportedLanguages() {
        return Object.entries(this.supportedLanguages).map(([code, info]) => ({
            code,
            name: info.name,
            native: info.native
        }));
    }

    // ========================
    // INITIALIZATION
    // ========================
    
    /**
     * Initialize translator
     */
    initialize() {
        console.log('LibreTranslator initialized');
        
        // Apply saved language on page load
        const savedLang = this.getLanguagePreference();
        if (savedLang && savedLang !== 'en') {
            // Delay to ensure page is fully loaded
            setTimeout(() => {
                this.translatePage(savedLang);
            }, 2000);
        }
    }
}

// ========================
// GLOBAL INSTANCE & FUNCTIONS
// ========================

let libreTranslator = null;

/**
 * Initialize LibreTranslator
 */
function initLibreTranslator(options = {}) {
    if (libreTranslator && libreTranslator.isTranslating) {
        console.warn('Cannot reinitialize while translating');
        return libreTranslator;
    }
    
    libreTranslator = new LibreTranslator(options);
    libreTranslator.initialize();
    
    return libreTranslator;
}

/**
 * Translate page to specific language
 */
function translatePageTo(langCode) {
    if (!libreTranslator) {
        console.error('LibreTranslator not initialized');
        alert('Please wait for translator to initialize');
        return;
    }
    
    libreTranslator.translatePage(langCode);
}

/**
 * Abort current translation
 */
function abortCurrentTranslation() {
    if (libreTranslator) {
        libreTranslator.abortTranslation();
    }
}

/**
 * Clear translation cache
 */
function clearTranslationCache() {
    if (libreTranslator) {
        const cleared = libreTranslator.clearAllCache();
        alert(`Cleared ${cleared} cached translations`);
    }
}

// ========================
// EVENT LISTENERS
// ========================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up translation system...');
    
    // Initialize translator
    initLibreTranslator({
        
        batchSize: 15,
        requestDelay: 150
    });
    
    // Setup language buttons
    setupLanguageButtons();
    
    // Setup language dropdown
    setupLanguageDropdown();
});

/**
 * Setup language buttons
 */
function setupLanguageButtons() {
    // Find all language buttons
    const buttons = document.querySelectorAll('[data-lang], .lang-btn, .language-option');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            let langCode = this.dataset.lang;
            
            // If no data-lang, try to infer from text
            if (!langCode) {
                const text = this.textContent.trim();
                const langMap = {
                    'English': 'en',
                    '中文': 'zh-CN',
                    '简体中文': 'zh-CN',
                    '繁體中文': 'zh-TW',
                    'Malay': 'ms',
                    'Tamil': 'ta',
                    '日本語': 'ja',
                    '한국어': 'ko',
                    'Français': 'fr',
                    'Deutsch': 'de',
                    'Español': 'es'
                };
                
                langCode = langMap[text] || 'en';
            }
            
            // Start translation
            translatePageTo(langCode);
            
            // Close dropdowns
            closeAllDropdowns();
        });
    });
}

/**
 * Setup language dropdown
 */
function setupLanguageDropdown() {
    const langButton = document.getElementById('langButton');
    if (langButton) {
        langButton.addEventListener('click', function(event) {
            event.stopPropagation();
            const dropdown = document.querySelector('.lang-dropdown-content, .hv-lang-dropdown-content');
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }
        });
    }
    
    // Click outside to close dropdowns
    document.addEventListener('click', function() {
        closeAllDropdowns();
    });
}

/**
 * Close all dropdowns
 */
function closeAllDropdowns() {
    document.querySelectorAll('.lang-dropdown-content, .hv-lang-dropdown-content').forEach(dropdown => {
        dropdown.style.display = 'none';
    });
}

// ========================
// GLOBAL EXPORTS
// ========================

window.LibreTranslator = LibreTranslator;
window.initLibreTranslator = initLibreTranslator;
window.translatePageTo = translatePageTo;
window.abortCurrentTranslation = abortCurrentTranslation;
window.clearTranslationCache = clearTranslationCache;