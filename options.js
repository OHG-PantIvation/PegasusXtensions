// Options page logic

async function initializeUI() {
  const state = await getUserState();
  const premium = await isPremium();

  // Update tier display
  const tierBadge = document.getElementById("tier-badge");
  const tierText = document.getElementById("tier-text");
  const tierContainer = document.getElementById("tier-container");
  const upgradeBtn = document.getElementById("upgrade-btn");

  if (premium) {
    tierBadge.textContent = "PREMIUM";
    tierBadge.className = "tier-badge premium";
    tierContainer.classList.add("premium");
    tierText.textContent = `Premium (until ${new Date(state.premiumUntil).toLocaleDateString()})`;
    upgradeBtn.textContent = "Premium Active ✓";
    upgradeBtn.disabled = true;
    document.getElementById("usage-counter").style.display = "none";

    // Mark all features as available
    document.querySelectorAll(".free-only").forEach((el) => {
      el.classList.remove("disabled");
    });
  } else {
    tierBadge.textContent = "FREE";
    tierBadge.className = "tier-badge free";
    tierText.textContent = "Free";
    upgradeBtn.disabled = false;

    // No daily cap on definition lookups
    document.getElementById("usage-text").textContent = "Unlimited";
    document.getElementById("usage-fill").style.width = "0%";

    // Mark features as disabled
    document.querySelectorAll(".free-only").forEach((el) => {
      el.classList.add("disabled");
    });
  }

  // Load word history
  loadWordHistory(state.wordHistory);

  // Event listeners
  upgradeBtn.addEventListener("click", handleUpgrade);
  document.getElementById("clear-history-btn").addEventListener("click", handleClearHistory);
}

function loadWordHistory(history) {
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyList.innerHTML =
      '<p style="color: #999; font-size: 13px;">No words looked up yet. Right-click any word to get started!</p>';
    return;
  }

  history.slice(0, 20).forEach((item) => {
    const div = document.createElement("div");
    div.className = "word-item";
    div.innerHTML = `
      <div class="word">${item.word}</div>
      <div class="definition">${item.definition}</div>
    `;
    historyList.appendChild(div);
  });
}

async function handleUpgrade() {
  // Simulate premium purchase for demo
  // In production, integrate with Stripe or similar
  await setPremium(30);
  showStatus("Premium activated for 30 days!", "success");
  setTimeout(() => {
    initializeUI();
  }, 1000);
}

async function handleClearHistory() {
  if (confirm("Clear all word history? This cannot be undone.")) {
    const state = await getUserState();
    state.wordHistory = [];
    await saveUserState(state);
    loadWordHistory([]);
    showStatus("History cleared.", "success");
  }
}

function showStatus(message, type) {
  const statusEl = document.getElementById("status-message");
  statusEl.textContent = message;
  statusEl.className = `status-message show ${type}`;
  setTimeout(() => {
    statusEl.classList.remove("show");
  }, 3000);
}

// Initialize on load
document.addEventListener("DOMContentLoaded", initializeUI);
