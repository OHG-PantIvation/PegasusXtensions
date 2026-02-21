const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map();

// Create context menu on install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "define-word",
    title: "Define: %s",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "define-word" && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      type: "getDefinition",
      word: info.selectionText.trim()
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) {
    return false;
  }

  if (message.type === "checkImage" && message.url) {
    (async () => {
      const ok = await isImageUrl(message.url);
      sendResponse({ ok });
    })();
    return true;
  }

  if (message.type === "fetchDefinition" && message.word) {
    (async () => {
      const definition = await getEnhancedWordDefinition(message.word);
      sendResponse({ definition });
    })();
    return true;
  }

  return false;
});

async function isImageUrl(url) {
  const cached = cache.get(url);
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.ok;
  }

  const ok = await checkContentType(url);
  cache.set(url, { ok, ts: now });
  return ok;
}

async function checkContentType(url) {
  try {
    const head = await fetch(url, { method: "HEAD", redirect: "follow" });
    const contentType = getContentType(head);
    if (isImageContentType(contentType)) {
      return true;
    }
  } catch (error) {
    // Fall through to GET attempt.
  }

  try {
    const get = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { Range: "bytes=0-0" }
    });
    const contentType = getContentType(get);
    return isImageContentType(contentType);
  } catch (error) {
    return false;
  }
}

function getContentType(response) {
  if (!response || !response.headers) {
    return "";
  }
  return (response.headers.get("content-type") || "").toLowerCase();
}

function isImageContentType(contentType) {
  return contentType.startsWith("image/");
}

async function getWordDefinition(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const entry = data[0];
    let definition = null;

    if (entry.meanings && entry.meanings.length > 0) {
      const meaning = entry.meanings[0];
      if (meaning.definitions && meaning.definitions.length > 0) {
        definition = meaning.definitions[0].definition;
      }
    }

    return {
      word: entry.word,
      phonetic: entry.phonetic || entry.phonetics?.[0]?.text || "",
      definition: definition,
      partOfSpeech: entry.meanings?.[0]?.partOfSpeech || ""
    };
  } catch (error) {
    console.error('Dictionary fetch error:', error);
    return null;
  }
}

async function getEnhancedWordDefinition(word) {
  try {
    const cleanWord = String(word || "").trim();
    if (!cleanWord) {
      return null;
    }

    const [dictionaryData, datamuseSynonyms, datamuseAntonyms, wikiSummary] = await Promise.all([
      fetchDictionaryEntry(cleanWord),
      fetchDatamuseTerms(cleanWord, "rel_syn", 12),
      fetchDatamuseTerms(cleanWord, "rel_ant", 12),
      fetchWikipediaSummary(cleanWord)
    ]);

    const entry = Array.isArray(dictionaryData) && dictionaryData.length > 0 ? dictionaryData[0] : null;
    const definitions = [];
    const synonyms = new Set();
    const antonyms = new Set();
    let etymology = null;

    // Extract all definitions, synonyms, and antonyms from dictionary data
    if (entry && entry.meanings && entry.meanings.length > 0) {
      entry.meanings.forEach((meaning) => {
        if (meaning.definitions && meaning.definitions.length > 0) {
          meaning.definitions.forEach((def) => {
            definitions.push({
              definition: def.definition,
              example: def.example,
              partOfSpeech: meaning.partOfSpeech,
            });

            if (Array.isArray(def.synonyms)) {
              def.synonyms.forEach((syn) => synonyms.add(syn));
            }
            if (Array.isArray(def.antonyms)) {
              def.antonyms.forEach((ant) => antonyms.add(ant));
            }
          });
        }
        if (meaning.synonyms && meaning.synonyms.length > 0) {
          meaning.synonyms.forEach((syn) => synonyms.add(syn));
        }
        if (meaning.antonyms && meaning.antonyms.length > 0) {
          meaning.antonyms.forEach((ant) => antonyms.add(ant));
        }
      });
    }

    // Enrich with free Datamuse results
    datamuseSynonyms.forEach((syn) => synonyms.add(syn));
    datamuseAntonyms.forEach((ant) => antonyms.add(ant));

    // Fallback to Wikipedia summary when dictionary definitions are unavailable
    if (definitions.length === 0 && wikiSummary && wikiSummary.extract) {
      definitions.push({
        definition: wikiSummary.extract,
        example: "",
        partOfSpeech: "reference"
      });
    }

    // Extract etymology
    if (entry && entry.origin) {
      etymology = entry.origin;
    }

    const phonetic = (entry && (entry.phonetic || entry.phonetics?.[0]?.text)) || "";
    const sourceLinks = [];

    if (wikiSummary && wikiSummary.url) {
      sourceLinks.push({
        label: "Wikipedia",
        url: wikiSummary.url
      });
    }

    sourceLinks.push({
      label: "Merriam-Webster",
      url: `https://www.merriam-webster.com/dictionary/${encodeURIComponent(cleanWord)}`
    });

    if (definitions.length === 0 && synonyms.size === 0 && antonyms.size === 0) {
      return null;
    }

    return {
      word: (entry && entry.word) || cleanWord,
      phonetic: phonetic,
      definitions: definitions,
      synonyms: Array.from(synonyms).slice(0, 8), // Top 8 synonyms
      antonyms: Array.from(antonyms).slice(0, 8), // Top 8 antonyms
      etymology: etymology,
      sourceLinks: sourceLinks,
      isPremiumData: true,
    };
  } catch (error) {
    console.error('Dictionary fetch error:', error);
    return null;
  }
}

async function fetchDictionaryEntry(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function fetchDatamuseTerms(word, relation, max = 12) {
  try {
    const response = await fetch(
      `https://api.datamuse.com/words?${relation}=${encodeURIComponent(word)}&max=${max}`
    );
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map((item) => item.word)
      .filter((term) => typeof term === "string" && term.trim().length > 0);
  } catch (error) {
    return [];
  }
}

async function fetchWikipediaSummary(word) {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`
    );
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || data.type === "https://mediawiki.org/wiki/HyperSwitch/errors/not_found") {
      return null;
    }

    return {
      extract: data.extract || "",
      url: data.content_urls?.desktop?.page || ""
    };
  } catch (error) {
    return null;
  }
}
