const PREVIEW_DELAY_MS = 200;
const OFFSET_PX = 16;

let hoverTimer = null;
let currentLink = null;
let currentRequestId = 0;
let previewEl = null;
let previewImg = null;
let lastMouse = { x: 0, y: 0 };
let definitionEl = null;
let definitionHideTimer = null;

document.addEventListener("mousemove", (event) => {
  lastMouse = { x: event.clientX, y: event.clientY };
  if (previewEl && previewEl.style.display === "block") {
    positionPreview();
  }
});

document.addEventListener(
  "mouseover",
  (event) => {
    const link = event.target.closest("a[href]");
    if (!link) {
      return;
    }

    if (currentLink === link) {
      return;
    }

    startHover(link);
  },
  true
);

document.addEventListener(
  "mouseout",
  (event) => {
    const link = event.target.closest("a[href]");
    if (!link || link !== currentLink) {
      return;
    }

    hidePreview();
  },
  true
);

document.addEventListener(
  "scroll",
  () => {
    if (previewEl && previewEl.style.display === "block") {
      positionPreview();
    }
  },
  true
);

function startHover(link) {
  clearTimeout(hoverTimer);
  currentLink = link;
  const requestId = ++currentRequestId;

  hoverTimer = setTimeout(async () => {
    const url = normalizeUrl(link.href);
    if (!url || requestId !== currentRequestId || link !== currentLink) {
      return;
    }

    if (isDirectImageUrl(url)) {
      showPreview(url, requestId, link);
      return;
    }

    const redditImageUrl = await getRedditGalleryImage(url);
    if (redditImageUrl) {
      showPreview(redditImageUrl, requestId, link);
      return;
    }

    const ok = await checkImageUrl(url);
    if (!ok || requestId !== currentRequestId || link !== currentLink) {
      return;
    }

    showPreview(url, requestId, link);
  }, PREVIEW_DELAY_MS);
}

function normalizeUrl(href) {
  try {
    const url = new URL(href, window.location.href);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch (error) {
    return null;
  }

  return null;
}

function isDirectImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
}

function isRedditGalleryUrl(url) {
  return /reddit\.com\/(gallery\/|r\/[^/]+\/comments\/)/.test(url);
}

async function getRedditGalleryImage(url) {
  if (!isRedditGalleryUrl(url)) {
    return null;
  }

  try {
    const jsonUrl = url.replace(/\/$/, '') + '.json';
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const post = data[0]?.data?.children?.[0]?.data;
    
    if (!post) {
      return null;
    }

    // Check for gallery_data
    if (post.is_gallery && post.gallery_data?.items) {
      const firstItem = post.gallery_data.items[0];
      const mediaId = firstItem?.media_id;
      if (mediaId && post.media_metadata?.[mediaId]) {
        const media = post.media_metadata[mediaId];
        // Get the largest preview or source image
        if (media.s?.u) {
          return media.s.u.replace(/&amp;/g, '&');
        }
        if (media.p && media.p.length > 0) {
          const largest = media.p[media.p.length - 1];
          return largest.u.replace(/&amp;/g, '&');
        }
      }
    }

    // Check for single image post
    if (post.url && isDirectImageUrl(post.url)) {
      return post.url;
    }

    // Check for preview images
    if (post.preview?.images?.[0]?.source?.url) {
      return post.preview.images[0].source.url.replace(/&amp;/g, '&');
    }
  } catch (error) {
    console.error('Reddit gallery fetch error:', error);
    return null;
  }

  return null;
}

function checkImageUrl(url) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "checkImage", url }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(false);
        return;
      }
      resolve(Boolean(response && response.ok));
    });
  });
}

function showPreview(url, requestId, link) {
  if (requestId !== currentRequestId || link !== currentLink) {
    return;
  }

  ensurePreview();
  previewEl.classList.add("chp-loading");
  previewImg.onload = () => {
    if (requestId !== currentRequestId || link !== currentLink) {
      return;
    }
    previewEl.classList.remove("chp-loading");
    previewEl.style.display = "block";
    positionPreview();
  };
  previewImg.onerror = () => {
    hidePreview();
  };
  previewImg.src = url;
}

function ensurePreview() {
  if (previewEl) {
    return;
  }

  previewEl = document.createElement("div");
  previewEl.id = "chp-preview";
  previewImg = document.createElement("img");
  previewEl.appendChild(previewImg);
  document.body.appendChild(previewEl);
}

function positionPreview() {
  if (!previewEl) {
    return;
  }

  const padding = 8;
  const maxX = window.innerWidth - previewEl.offsetWidth - padding;
  const maxY = window.innerHeight - previewEl.offsetHeight - padding;

  let x = lastMouse.x + OFFSET_PX;
  let y = lastMouse.y + OFFSET_PX;

  if (x > maxX) {
    x = Math.max(padding, lastMouse.x - OFFSET_PX - previewEl.offsetWidth);
  }
  if (y > maxY) {
    y = Math.max(padding, lastMouse.y - OFFSET_PX - previewEl.offsetHeight);
  }

  previewEl.style.left = `${x}px`;
  previewEl.style.top = `${y}px`;
}

function hidePreview() {
  clearTimeout(hoverTimer);
  currentLink = null;
  if (previewEl) {
    previewEl.style.display = "none";
    previewEl.classList.remove("chp-loading");
    previewImg.removeAttribute("src");
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) {
    return false;
  }

  if (message.type === "getDefinition" && message.word) {
    (async () => {
      const canUse = await canUseDefinition();
      if (!canUse.allowed) {
        showLimitWarning(canUse.message);
        return;
      }

      const response = await chrome.runtime.sendMessage({
        type: "fetchDefinition",
        word: message.word
      });
      if (response && response.definition) {
        showDefinition(response.definition);

        try {
          await recordDefinitionUsage();
          await addToWordHistory(message.word, response.definition);
        } catch (error) {
          console.error("Definition usage/history save failed:", error);
        }
      }
    })();
    return true;
  }

  return false;
});

function showDefinition(definition) {
  clearDefinitionHideTimer();
  ensureDefinition();

  const definitions = Array.isArray(definition.definitions)
    ? definition.definitions
    : definition.definition
      ? [{
          definition: definition.definition,
          partOfSpeech: definition.partOfSpeech || "",
          example: "",
        }]
      : [];
  const hasDefinitions = definitions.length > 0;
  const hasSynonyms = Array.isArray(definition.synonyms) && definition.synonyms.length > 0;
  const hasAntonyms = Array.isArray(definition.antonyms) && definition.antonyms.length > 0;
  const hasEtymology = Boolean(definition.etymology);
  const hasSources = Array.isArray(definition.sourceLinks) && definition.sourceLinks.length > 0;

  const tabs = [];
  if (hasDefinitions) tabs.push({ id: "definition", label: "Definition" });
  if (hasSynonyms) tabs.push({ id: "synonyms", label: "Synonyms" });
  if (hasAntonyms) tabs.push({ id: "antonyms", label: "Antonyms" });
  if (hasEtymology) tabs.push({ id: "etymology", label: "Origin" });
  if (hasSources) tabs.push({ id: "sources", label: "Sources" });

  const activeTab = tabs[0]?.id || "definition";
  const tabsHTML = tabs.length > 1
    ? `
      <div class="chp-def-tabs">
        ${tabs
          .map(
            (tab) =>
              `<button class="chp-tab-btn ${tab.id === activeTab ? "active" : ""}" data-tab="${tab.id}">${tab.label}</button>`
          )
          .join("")}
      </div>
    `
    : "";

  let contentHTML = `
    <div class="chp-def-word">${definition.word}</div>
    ${definition.phonetic ? `<div class="chp-def-phonetic">${definition.phonetic}</div>` : ""}
    ${tabsHTML}
    <div class="chp-def-content">
  `;

  // Definition tab content
  if (hasDefinitions) {
    contentHTML += `
      <div class="chp-tab-content ${activeTab === "definition" ? "active" : ""}" data-tab="definition">
        ${definitions
          .slice(0, 3)
          .map(
            (d) => `
          <div class="chp-def-item">
            <div class="chp-def-speech"><em>${d.partOfSpeech}</em></div>
            <div class="chp-def-text">${d.definition}</div>
            ${d.example ? `<div class="chp-def-example">"${d.example}"</div>` : ""}
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  // Synonyms tab content
  if (hasSynonyms) {
    contentHTML += `
      <div class="chp-tab-content ${activeTab === "synonyms" ? "active" : ""}" data-tab="synonyms">
        <div class="chp-synonyms">
          ${definition.synonyms.map((syn) => `<span class="chp-synonym">${syn}</span>`).join("")}
        </div>
      </div>
    `;
  }

  // Antonyms tab content
  if (hasAntonyms) {
    contentHTML += `
      <div class="chp-tab-content ${activeTab === "antonyms" ? "active" : ""}" data-tab="antonyms">
        <div class="chp-synonyms">
          ${definition.antonyms.map((ant) => `<span class="chp-antonym">${ant}</span>`).join("")}
        </div>
      </div>
    `;
  }

  // Etymology tab content
  if (hasEtymology) {
    contentHTML += `
      <div class="chp-tab-content ${activeTab === "etymology" ? "active" : ""}" data-tab="etymology">
        <div class="chp-etymology">${definition.etymology}</div>
      </div>
    `;
  }

  // Source links tab content
  if (hasSources) {
    contentHTML += `
      <div class="chp-tab-content ${activeTab === "sources" ? "active" : ""}" data-tab="sources">
        <div class="chp-source-links">
          ${definition.sourceLinks
            .map(
              (source) =>
                `<a class="chp-source-link" href="${source.url}" target="_blank" rel="noopener noreferrer">${source.label}</a>`
            )
            .join("")}
        </div>
      </div>
    `;
  }

  contentHTML += `</div>`;

  definitionEl.innerHTML = contentHTML;
  definitionEl.style.display = "block";

  // Add tab click handlers
  if (tabs.length > 1) {
    const tabBtns = definitionEl.querySelectorAll(".chp-tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tabName = e.target.dataset.tab;
        definitionEl.querySelectorAll(".chp-tab-btn").forEach((b) => b.classList.remove("active"));
        definitionEl.querySelectorAll(".chp-tab-content").forEach((c) => c.classList.remove("active"));
        e.target.classList.add("active");
        definitionEl.querySelector(`[data-tab="${tabName}"].chp-tab-content`).classList.add("active");
      });
    });
  }

  positionDefinition();

  scheduleDefinitionHide(1800);
}

function showLimitWarning(message) {
  clearDefinitionHideTimer();
  ensureDefinition();
  definitionEl.innerHTML = `
    <div class="chp-limit-warning">
      <div class="chp-warning-icon">⚠️</div>
      <div class="chp-warning-title">Daily Limit Reached</div>
      <div class="chp-warning-text">${message}</div>
      <a href="${chrome.runtime.getURL('options.html')}" class="chp-upgrade-link" target="_blank">Upgrade Now →</a>
    </div>
  `;
  definitionEl.style.display = "block";
  positionDefinition();

  scheduleDefinitionHide(2400);
}

function ensureDefinition() {
  if (definitionEl) {
    return;
  }

  definitionEl = document.createElement("div");
  definitionEl.id = "chp-definition";
  definitionEl.addEventListener("mouseenter", () => {
    clearDefinitionHideTimer();
  });
  definitionEl.addEventListener("mouseleave", () => {
    scheduleDefinitionHide(900);
  });
  document.body.appendChild(definitionEl);
}

function clearDefinitionHideTimer() {
  if (definitionHideTimer) {
    clearTimeout(definitionHideTimer);
    definitionHideTimer = null;
  }
}

function scheduleDefinitionHide(delayMs) {
  clearDefinitionHideTimer();
  definitionHideTimer = setTimeout(() => {
    if (definitionEl && definitionEl.style.display === "block") {
      definitionEl.style.display = "none";
    }
  }, delayMs);
}

function positionDefinition() {
  if (!definitionEl) {
    return;
  }

  const padding = 8;
  const maxX = window.innerWidth - definitionEl.offsetWidth - padding;
  const maxY = window.innerHeight - definitionEl.offsetHeight - padding;

  let x = lastMouse.x + OFFSET_PX;
  let y = lastMouse.y + OFFSET_PX;

  if (x > maxX) {
    x = Math.max(padding, lastMouse.x - OFFSET_PX - definitionEl.offsetWidth);
  }
  if (y > maxY) {
    y = Math.max(padding, lastMouse.y - OFFSET_PX - definitionEl.offsetHeight);
  }

  definitionEl.style.left = `${x}px`;
  definitionEl.style.top = `${y}px`;
}
