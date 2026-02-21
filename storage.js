// Storage management for user tier, usage stats, and history

const DEFAULT_USER_STATE = {
  tier: "free", // or "premium"
  definitionsUsedToday: 0,
  lastUsageReset: new Date().toDateString(),
  wordHistory: [],
  premiumUntil: null,
};

const DAILY_FREE_LIMIT = 5;
const MAX_SYNC_HISTORY_ITEMS = 30;
const MAX_DEFINITION_LENGTH = 180;

async function getUserState() {
  return new Promise((resolve) => {
    chrome.storage.sync.get("userState", (result) => {
      if (result.userState) {
        // Check if day changed, reset usage
        const today = new Date().toDateString();
        if (result.userState.lastUsageReset !== today) {
          result.userState.definitionsUsedToday = 0;
          result.userState.lastUsageReset = today;
          saveUserState(result.userState);
        }
        resolve(result.userState);
      } else {
        saveUserState(DEFAULT_USER_STATE);
        resolve(DEFAULT_USER_STATE);
      }
    });
  });
}

async function saveUserState(userState) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ userState }, resolve);
  });
}

async function isPremium() {
  const state = await getUserState();
  if (state.tier === "premium" && state.premiumUntil) {
    return new Date(state.premiumUntil) > new Date();
  }
  return false;
}

async function canUseDefinition() {
  return {
    allowed: true,
    remaining: null,
  };
}

async function recordDefinitionUsage() {
  const state = await getUserState();
  state.definitionsUsedToday++;
  await saveUserState(state);
}

async function addToWordHistory(word, definition) {
  const state = await getUserState();
  if (!Array.isArray(state.wordHistory)) {
    state.wordHistory = [];
  }

  const bestDefinition = definition?.definition
    || definition?.definitions?.[0]?.definition
    || "No definition available";

  const cleanWord = String(word || "").trim();
  if (!cleanWord) {
    return;
  }

  const compactDefinition = String(bestDefinition)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_DEFINITION_LENGTH);

  state.wordHistory = state.wordHistory.filter((item) => item.word !== cleanWord);

  state.wordHistory.unshift({
    word: cleanWord,
    definition: compactDefinition,
    timestamp: Date.now(),
  });
  // Keep history compact for sync quota reliability
  state.wordHistory = state.wordHistory.slice(0, MAX_SYNC_HISTORY_ITEMS);
  await saveUserState(state);
}

async function setPremium(days) {
  const state = await getUserState();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  state.tier = "premium";
  state.premiumUntil = expiryDate.toISOString();
  await saveUserState(state);
}
