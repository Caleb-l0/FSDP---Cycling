/* ===========================
   CLIENT: translate.js
   - Uses /translate/batch with chunking
   - Validates JSON responses
   - Caches per language + text hash
   =========================== */

async function translatePage(targetLang) {
  console.log(`Starting translation to ${targetLang}...`);

  const progressEl = document.createElement("div");
  progressEl.id = "translation-progress";
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

  // Change this to your Render URL (or keep relative if same domain)
  const API_URL = "https://fsdp-cycling-ltey.onrender.com/translate/batch";

  try {
    progressEl.textContent = "Preparing translation...";

    const selectors =
      "h1, h2, h3, h4, h5, h6, p, a, button, .section-title, .hero-content";

    // Collect unique visible texts
    const seen = new Set();
    const items = [];
    document.querySelectorAll(selectors).forEach((el) => {
      if (!isElementVisible(el)) return;

      const text = (el.textContent || "").trim();
      if (!text || text.length <= 2) return;

      // Avoid translating icon-only or empty elements
      if (el.matches('span') && (el.className || "").includes("icon")) return;

      // Deduplicate by exact text
      if (seen.has(text)) return;
      seen.add(text);

      items.push({ element: el, text });
    });

    console.log(`Collected ${items.length} unique texts for translation`);
    progressEl.textContent = `Translating ${items.length} items...`;

    // Build a stable list of texts and apply cache first
    const texts = [];
    const indexMap = []; // maps texts[] index to items[] index
    let cachedCount = 0;

    for (let i = 0; i < items.length; i++) {
      const cacheKey = makeCacheKey(targetLang, items[i].text);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        items[i].element.textContent = cached;
        cachedCount++;
      } else {
        indexMap.push(i);
        texts.push(items[i].text);
      }
    }

    if (texts.length === 0) {
      progressEl.textContent = `✅ Translated ${cachedCount}/${items.length} items (cached)`;
      setTimeout(() => progressEl.remove(), 1500);
      localStorage.setItem("targetLanguage", targetLang);
      return;
    }

    // Translate in chunks to avoid server limits/timeouts
    const CHUNK_SIZE = 25;
    let successCount = cachedCount;

    for (let start = 0; start < texts.length; start += CHUNK_SIZE) {
      const end = Math.min(start + CHUNK_SIZE, texts.length);
      const chunk = texts.slice(start, end);

      progressEl.textContent = `Translating... ${Math.min(end, texts.length)}/${texts.length} (plus cached ${cachedCount})`;

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_language: targetLang,
          texts: chunk,
        }),
      });

      // Validate response type before JSON parsing
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        const raw = await res.text().catch(() => "");
        console.error("Translation server returned non-JSON or error:", {
          status: res.status,
          contentType,
          raw: raw.slice(0, 400),
        });
        throw new Error(`Translation server error (${res.status})`);
      }

      const data = await res.json();

      if (!data || !Array.isArray(data.translations)) {
        console.error("Invalid translation payload:", data);
        throw new Error("Invalid translation payload");
      }

      if (data.translations.length !== chunk.length) {
        console.warn("Mismatched translation count:", {
          sent: chunk.length,
          got: data.translations.length,
        });
      }

      // Apply translations back to original elements
      for (let i = 0; i < chunk.length; i++) {
        const translated = data.translations[i];
        const originalText = chunk[i];

        if (typeof translated !== "string" || !translated.trim()) continue;

        // Find the corresponding original item index
        const itemsIndex = indexMap[start + i];
        if (itemsIndex == null) continue;

        items[itemsIndex].element.textContent = translated;

        // Cache
        const cacheKey = makeCacheKey(targetLang, originalText);
        localStorage.setItem(cacheKey, translated);
        successCount++;
      }

      // Small delay to reduce burst load
      await sleep(120);
    }

    progressEl.textContent = `✅ Translated ${successCount}/${items.length} items`;
    progressEl.style.background = "#4CAF50";

    localStorage.setItem("targetLanguage", targetLang);

    setTimeout(() => progressEl.remove(), 2000);
  } catch (error) {
    console.error("Translation failed:", error);
    progressEl.textContent = `❌ Error: ${error.message}`;
    progressEl.style.background = "#f44336";
    setTimeout(() => progressEl.remove(), 3000);
    alert(`Translation failed: ${error.message}`);
  }
}

function makeCacheKey(targetLang, text) {
  return `trans_${targetLang}_${hashCode(text)}`;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // 32-bit
  }
  return String(hash);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isElementVisible(el) {
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

// Replace inline onclick="translatePage('xx')" safely
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('[onclick*="translatePage"]').forEach((btn) => {
    const old = btn.getAttribute("onclick") || "";
    const match = old.match(/translatePage\('([^']+)'\)/);
    if (!match) return;

    const lang = match[1];
    btn.removeAttribute("onclick");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      translatePage(lang);
    });
  });
});

/* ===========================
   SERVER: index.js (Express)
   - /translate (single)
   - /translate/batch (recommended)
   - CORS, rate limit, JSON validation
   - Uses LibreTranslate by default (swap provider easily)
   =========================== */

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { translateOne, translateBatch } = require("./translateService");

const app = express();

// Render/Proxies safety
app.set("trust proxy", 1);

// CORS: allow your frontend origin(s)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "100kb" }));

// Basic health check
app.get("/", (req, res) => {
  res.status(200).json({ ok: true, service: "translation-api" });
});

// Rate limit to protect free instances
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Single translate
app.post("/translate", async (req, res) => {
  try {
    const { text, target_language } = req.body || {};
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "text must be a non-empty string" });
    }
    if (typeof target_language !== "string" || !target_language.trim()) {
      return res.status(400).json({ error: "target_language must be a non-empty string" });
    }

    const translation = await translateOne(text, target_language);
    return res.status(200).json({ translation });
  } catch (err) {
    console.error("POST /translate error:", err);
    return res.status(500).json({ error: "translation_failed" });
  }
});

// Batch translate (recommended)
app.post("/translate/batch", async (req, res) => {
  try {
    const { texts, target_language } = req.body || {};

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: "texts must be a non-empty array of strings" });
    }
    if (texts.length > 50) {
      return res.status(400).json({ error: "texts max length is 50 per request" });
    }
    if (typeof target_language !== "string" || !target_language.trim()) {
      return res.status(400).json({ error: "target_language must be a non-empty string" });
    }
    if (texts.some((t) => typeof t !== "string" || !t.trim())) {
      return res.status(400).json({ error: "texts must contain only non-empty strings" });
    }

    const translations = await translateBatch(texts, target_language);
    return res.status(200).json({ translations });
  } catch (err) {
    console.error("POST /translate/batch error:", err);
    return res.status(500).json({ error: "translation_failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Translation server running on :${PORT}`));
/* ===========================
   SERVER: translateService.js
   Default provider: LibreTranslate
   - Set LIBRETRANSLATE_URL in Render env
   - Optional: LIBRETRANSLATE_API_KEY
   =========================== */

const DEFAULT_LT_URL = "https://libretranslate.com/translate";

function getProviderConfig() {
  return {
    url: process.env.LIBRETRANSLATE_URL || DEFAULT_LT_URL,
    apiKey: process.env.LIBRETRANSLATE_API_KEY || "",
  };
}

export async function translateOne(text, targetLang) {
  const { url, apiKey } = getProviderConfig();

  const payload = {
    q: text,
    source: "auto",
    target: targetLang,
    format: "text",
  };

  if (apiKey) payload.api_key = apiKey;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok || !contentType.includes("application/json")) {
    const raw = await res.text().catch(() => "");
    throw new Error(`Provider error: ${res.status} ${raw.slice(0, 200)}`);
  }

  const data = await res.json();

  // LibreTranslate returns: { translatedText: "..." }
  const out = data?.translatedText;
  if (typeof out !== "string") throw new Error("Provider payload invalid");
  return out;
}

export async function translateBatch(texts, targetLang) {
  // LibreTranslate does not officially support batch in one call on all hosts.
  // We do a small controlled parallel fan-out server-side (much safer than browser fan-out).
  const CONCURRENCY = 4;
  const results = new Array(texts.length);

  let idx = 0;
  async function worker() {
    while (idx < texts.length) {
      const cur = idx++;
      results[cur] = await translateOne(texts[cur], targetLang);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, texts.length) }, () => worker());
  await Promise.all(workers);

  return results;
}
