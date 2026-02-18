// Bulldog Realm — app.js (compatible with current index.html)
// NOTE: Inline onclick handlers in index.html expect these globals:
// selectChar, startGame, showScreen, switchTab, performAction, enterDungeon, showWeaponInfo

// -------------------------------
// Initialisierung / State
// -------------------------------
const defaultGameData = {
  selectedChar: null, // 'shadow' | 'cotton' | 'titan'
  level: 1,
  xp: 0,
  gold: 0,
  hunger: 100,
  energy: 100,
  joy: 100,
};

let gameData = (window.BRState ? BRState.init(defaultGameData) : structuredClone(defaultGameData));

// Optional: Fallback-Metadaten (falls DOM-Parsing mal fehlschlägt)
const CHAR_META = {
  shadow: { name: "Shadow", image: "shadow.png" },
  cotton: { name: "Cotton", image: "fluffy.png" },
  titan:  { name: "Titan",  image: "titan.png" },
};

// -------------------------------
// Save
// -------------------------------
function saveGame() {
  if (window.BRState) {
    BRState.save();
  } else {
    localStorage.setItem("bulldogRealm_save", JSON.stringify(gameData));
  }
}

// -------------------------------
// DOM Helpers
// -------------------------------
function $(id) { return document.getElementById(id); }

function getSelectedCharCard() {
  if (!gameData.selectedChar) return null;
  return document.querySelector("." + gameData.selectedChar);
}

// IMPORTANT: In the select cards there are 2 images: frame + character.
// We must pick ONLY the character image.
function resolveSelectedCharImageSrc() {
  const card = getSelectedCharCard();
  const imgEl =
    card?.querySelector("img.char-img") ||
    card?.querySelector(".char-content img") || // fallback (2nd best)
    null;

  const src = imgEl?.getAttribute("src")?.trim();
  if (src) return src;

  const meta = CHAR_META[gameData.selectedChar];
  return meta ? meta.image : "";
}

function resolveSelectedCharName() {
  const card = getSelectedCharCard();
  const nameEl = card?.querySelector(".char-name");
  const text = nameEl?.textContent?.trim();
  if (text) return text;

  const meta = CHAR_META[gameData.selectedChar];
  return meta ? meta.name : "";
}

// -------------------------------
// Screen switching
// -------------------------------
// index.html uses both:
// - showScreen('select')  (back buttons)
// - switchTab('home')     (bottom nav)
// Screens in DOM are: selectScreen, homeScreen, dungeonScreen, inventoryScreen, collectionScreen
const SCREEN_MAP = {
  select: "selectScreen",
  home: "homeScreen",
  dungeon: "dungeonScreen",
  inventory: "inventoryScreen",
  collection: "collectionScreen",
};

function showScreen(keyOrId) {
  const id = SCREEN_MAP[keyOrId] || keyOrId; // accept 'home' OR 'homeScreen'

  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const el = $(id);
  if (el) el.classList.add("active");

  // refresh UI when landing on home
  if (id === "homeScreen") renderHome();
}

function switchTab(tabKey) {
  showScreen(tabKey);
}

// -------------------------------
// Character Auswahl
// -------------------------------
function selectChar(char) {
  if (window.BRState) {
    BRState.setState({ selectedChar: char });
    gameData = BRState.getState();
  } else {
    gameData.selectedChar = char;
  }

  document.querySelectorAll(".char-card-wrapper").forEach((c) => c.classList.remove("selected"));
  document.querySelector("." + char)?.classList.add("selected");

  const btn = $("startBtn");
  if (btn) {
    btn.classList.add("active");
    btn.disabled = false;
  }

  // Save immediately (mobile-safe)
  saveGame();
}

// -------------------------------
// Start game (Select -> Home)
// -------------------------------
function startGame() {
  if (!gameData.selectedChar) return;
  showScreen("home");
}

// -------------------------------
// Home render (bars, gold, level, portrait)
// IDs in index.html:
// gold, level, homeHungerBar, homeEnergyBar, homeHappyBar, homeCharImg, homeCharName
// -------------------------------
function renderHome() {
  const goldEl = $("gold");
  if (goldEl) goldEl.textContent = String(gameData.gold);

  const levelEl = $("level");
  if (levelEl) levelEl.textContent = String(gameData.level);

  const hungerBar = $("homeHungerBar");
  if (hungerBar) hungerBar.style.width = `${gameData.hunger}%`;

  const energyBar = $("homeEnergyBar");
  if (energyBar) energyBar.style.width = `${gameData.energy}%`;

  const happyBar = $("homeHappyBar");
  if (happyBar) happyBar.style.width = `${gameData.joy}%`;

  // Portrait + name
  const homeImg = $("homeCharImg");
  if (homeImg && gameData.selectedChar) {
    const src = resolveSelectedCharImageSrc();
    if (src) homeImg.src = src;
    homeImg.alt = resolveSelectedCharName() || "Character";
  }

  const homeName = $("homeCharName");
  if (homeName && gameData.selectedChar) {
    const nm = resolveSelectedCharName();
    if (nm) homeName.textContent = nm;
  }
}

// -------------------------------
// Actions (Tamagotchi buttons call performAction in index.html)
// -------------------------------
function performAction(type) {
  // Map to internal names
  doAction(type);
}

function doAction(type) {
  switch (type) {
    case "feed":
      gameData.hunger = Math.min(100, gameData.hunger + 12);
      gameData.gold = Math.max(0, gameData.gold - 1);
      break;
    case "sleep":
      gameData.energy = Math.min(100, gameData.energy + 12);
      break;
    case "play":
      gameData.joy = Math.min(100, gameData.joy + 12);
      gameData.gold = Math.max(0, gameData.gold - 1);
      break;
    case "train":
      addXp(6);
      gameData.energy = Math.max(0, gameData.energy - 4);
      break;
    default:
      return;
  }

  if (window.BRState) {
    BRState.setState(gameData);
    gameData = BRState.getState();
  }

  renderHome();
  saveGame();
}

function addXp(amount) {
  gameData.xp += amount;
  const need = gameData.level * 20;
  if (gameData.xp >= need) {
    gameData.xp -= need;
    gameData.level += 1;
    gameData.gold += 5; // small reward
  }
}

// -------------------------------
// Dungeon (index.html calls enterDungeon(1|2))
// -------------------------------
function enterDungeon(difficulty) {
  // Minimal placeholder that proves click works; real dungeon later
  const diff = Number(difficulty) || 1;
  alert(`Dungeon (Schwierigkeit ${diff}) kommt als nächstes. ✅`);
  // record last selection in state (optional)
  if (window.BRState) {
    BRState.setState({ lastDungeon: diff });
    gameData = BRState.getState();
  } else {
    gameData.lastDungeon = diff;
  }
  saveGame();
}

// -------------------------------
// Weapon info modal placeholder (index.html calls showWeaponInfo())
// -------------------------------
function showWeaponInfo() {
  alert("Waffen/Equipment kommt als nächstes (Inventar + Ausrüsten).");
}

// -------------------------------
// Mobile-safe autosave hooks
// -------------------------------
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveGame();
});
window.addEventListener("pagehide", saveGame);

// -------------------------------
// Auto-resume (if selectedChar exists, enable Start and/or jump home)
// -------------------------------
window.addEventListener("load", () => {
  // Sync gameData from BRState after init (already done), then update UI
  if (gameData.selectedChar) {
    document.querySelector("." + gameData.selectedChar)?.classList.add("selected");
    const btn = $("startBtn");
    if (btn) {
      btn.classList.add("active");
      btn.disabled = false;
    }
    // If a character was chosen before, resume directly to home
    showScreen("home");
  } else {
    showScreen("select");
  }
});
