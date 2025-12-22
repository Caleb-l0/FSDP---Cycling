// Fixed version of translation function
async function translatePage(targetLang) {
    console.log(`Starting translation to ${targetLang}...`);
    
    // Show progress indicator
    const progressEl = document.createElement('div');
    progressEl.id = 'translation-progress';
    progressEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-weight: bold;
    `;
    document.body.appendChild(progressEl);
    
    try {
        // Update progress
        progressEl.textContent = 'Preparing translation...';
        
        // Collect text elements
        const elements = [];
        const texts = new Set();
        
        // Only translate visible main text
        const selectors = 'h1, h2, h3, h4, h5, h6, p, span:not([class*="icon"]), a, button, .section-title, .hero-content';
        
        document.querySelectorAll(selectors).forEach(el => {
            const text = el.textContent.trim();
            if (text && text.length > 2 && !texts.has(text)) {
                texts.add(text);
                elements.push({
                    element: el,
                    text: text,
                    html: el.innerHTML
                });
            }
        });
        
        console.log(`Collected ${elements.length} texts for translation`);
        progressEl.textContent = `Translating ${elements.length} items...`;
        
        // Use more reliable API call method
        const API_URL = "https://fsdp-cycling-ltey.onrender.com/translate";
        let successCount = 0;
        
        for (let i = 0; i < elements.length; i++) {
            const item = elements[i];
            
            try {
                // Update progress
                progressEl.textContent = `Translating... ${i+1}/${elements.length}`;
                
                // Check for cache
                const cacheKey = `trans_${targetLang}_${hashCode(item.text)}`;
                const cached = localStorage.getItem(cacheKey);
                
                if (cached) {
                    item.element.textContent = cached;
                    successCount++;
                    continue;
                }
                
                // Call API
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: item.text,
                        target_language: targetLang
                    })
                });
                
                // Check response status
                if (response.status === 502) {
                    throw new Error('Server is temporarily unavailable (502)');
                }
                
                if (!response.ok) {
                    console.warn(`API returned ${response.status} for: ${item.text.substring(0, 50)}...`);
                    continue;
                }
                
                // Parse response
                const result = await response.json();
                
                if (result && result.translation) {
                    item.element.textContent = result.translation;
                    // Cache result
                    localStorage.setItem(cacheKey, result.translation);
                    successCount++;
                }
                
                // Delay to avoid server overload
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.warn(`Failed to translate "${item.text.substring(0, 30)}...":`, error.message);
            }
        }
        
        // Update progress when complete
        progressEl.textContent = `✅ Translated ${successCount}/${elements.length} items`;
        progressEl.style.background = '#4CAF50';
        
        // Save language preference
        localStorage.setItem('targetLanguage', targetLang);
        
        // Hide progress after 3 seconds
        setTimeout(() => {
            progressEl.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Translation failed:', error);
        progressEl.textContent = `❌ Error: ${error.message}`;
        progressEl.style.background = '#f44336';
        
        setTimeout(() => {
            progressEl.remove();
        }, 3000);
        
        alert(`Translation failed: ${error.message}\n\nPlease check if the translation server is running.`);
    }
}

// Helper function: Generate hash for string
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

// Initialize language buttons
document.addEventListener('DOMContentLoaded', function() {
    // Add click events to language buttons
    document.querySelectorAll('[onclick*="translatePage"]').forEach(btn => {
        const oldOnClick = btn.getAttribute('onclick');
        const match = oldOnClick.match(/translatePage\('([^']+)'\)/);
        
        if (match) {
            const lang = match[1];
            btn.removeAttribute('onclick');
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                translatePage(lang);
            });
        }
    });
});