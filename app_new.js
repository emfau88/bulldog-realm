// ===============================
// Bulldog Realm — app.js
// ===============================

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

// Optional: Fallback-Metadaten (nur wenn DOM nicht genug Infos liefert)
const CHAR_META = {
  shadow: { name: "Shadow", image: "shadow.png" },
  cotton: { name: "Cotton", image: "fluffy.png" }, // dein aktuelles fluffy.png
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
// Helpers: Character aus DOM ermitteln
// -------------------------------
function getSelectedCharCard() {
  if (!gameData.selectedChar) return null;
  return document.querySelector("." + gameData.selectedChar);
}

function resolveSelectedCharImageSrc() {
  const card = getSelectedCharCard();
  // Versuche: direkt ein <img> in der Card nutzen (robust gegen Dateinamen/Ordner)
  const imgEl = card ? card.querySelector("img") : null;
  if (imgEl && imgEl.getAttribute("src")) return imgEl.getAttribute("src");

  // Fallback: bekannte Dateien im Root
  const meta = CHAR_META[gameData.selectedChar];
  return meta ? meta.image : "";
}

function resolveSelectedCharName() {
  const card = getSelectedCharCard();
  // Versuche: Name-Element in der Card lesen
  const nameEl =
    card?.querySelector("[data-char-name]") ||
    card?.querySelector(".char-name") ||
    card?.querySelector("h2") ||
    card?.querySelector("h3");

  const text = nameEl?.textContent?.trim();
  if (text) return text;

  // Fallback
  const meta = CHAR_META[gameData.selectedChar];
  return meta ? meta.name : "";
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

  const btn = document.getElementById("startBtn");
  if (btn) {
    btn.classList.add("active");
    btn.disabled = false; // WICHTIG
  }

  saveGame();
}

// -------------------------------
// Spiel Start
// -------------------------------
function startGame() {
  if (!gameData.selectedChar) return;

  document.getElementById("selectScreen")?.classList.remove("active");
  document.getElementById("homeScreen")?.classList.add("active");

  renderHome();
}

// -------------------------------
// Home Screen
// -------------------------------
function renderHome() {
  // Ressourcen/Level
  const goldEl = document.getElementById("goldValue");
  if (goldEl) goldEl.innerText = gameData.gold;

  const levelEl = document.getElementById("levelValue");
  if (levelEl) levelEl.innerText = gameData.level;

  // Bars
  const hungerBar = document.getElementById("hungerBar");
  if (hungerBar) hungerBar.style.width = gameData.hunger + "%";

  const energyBar = document.getElementById("energyBar");
  if (energyBar) energyBar.style.width = gameData.energy + "%";

  const joyBar = document.getElementById("joyBar");
  if (joyBar) joyBar.style.width = gameData.joy + "%";

  // --- FIX: gewählten Charakter auf Home anzeigen ---
  // (IDs werden nur gesetzt, wenn sie existieren – bricht sonst nichts)
  const homeImg = document.getElementById("homeCharImg");
  if (homeImg && gameData.selectedChar) {
    const src = resolveSelectedCharImageSrc();
    if (src) homeImg.src = src;
    homeImg.alt = resolveSelectedCharName() || "Character";
  }

  const homeName = document.getElementById("homeCharName");
  if (homeName && gameData.selectedChar) {
    const nm = resolveSelectedCharName();
    if (nm) homeName.textContent = nm;
  }
}

// -------------------------------
// Aktionen
// -------------------------------
function doAction(type) {
  switch (type) {
    case "feed":
      gameData.hunger = Math.min(100, gameData.hunger + 10);
      break;
    case "sleep":
      gameData.energy = Math.min(100, gameData.energy + 10);
      break;
    case "play":
      gameData.joy = Math.min(100, gameData.joy + 10);
      break;
    case "train":
      addXp(5);
      break;
  }

  if (window.BRState) {
    BRState.setState(gameData);
    gameData = BRState.getState();
  }

  renderHome();
  saveGame();
}

// -------------------------------
// XP / Level
// -------------------------------
function addXp(amount) {
  gameData.xp += amount;

  if (gameData.xp >= gameData.level * 20) {
    gameData.xp = 0;
    gameData.level++;
  }

  if (window.BRState) {
    BRState.setState(gameData);
    gameData = BRState.getState();
  }

  saveGame();
}

// -------------------------------
// Navigation
// -------------------------------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");

  // Wenn Home angezeigt wird: sicherstellen, dass Portrait/Name gesetzt sind
  if (id === "homeScreen") renderHome();
}

// -------------------------------
// Dungeon MVP
// -------------------------------
function enterDungeon() {
  alert("Dungeon kommt bald ");
  saveGame();
}

// -------------------------------
// Mobile Safe Autosave
// -------------------------------
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveGame();
});
window.addEventListener("pagehide", saveGame);

// -------------------------------
// Auto Resume
// -------------------------------
window.addEventListener("load", () => {
  if (gameData.selectedChar) {
    document.querySelector("." + gameData.selectedChar)?.classList.add("selected");
    const btn = document.getElementById("startBtn");
    if (btn) {
      btn.classList.add("active");
      btn.disabled = false;
    }
    startGame();
  }
});


function performAction(type) {
  // Backward-compatible wrapper used by inline onclick in index.html
  doAction(type);
}


function switchTab(tab) {
  const map = {
    home: 'homeScreen',
    dungeon: 'dungeonScreen',
    inventory: 'inventoryScreen',
    collection: 'collectionScreen',
  };
  const targetId = map[tab] || 'homeScreen';
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('active'));
  const target = document.getElementById(targetId);
  if (target) target.classList.add('active');

  // nav active state
  const navButtons = document.querySelectorAll('.bottom-nav .nav-btn');
  navButtons.forEach(btn => {
    if (btn.dataset && btn.dataset.tab) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    } else {
      // fallback: compare onclick text
      const oc = btn.getAttribute('onclick') || '';
      btn.classList.toggle('active', oc.includes("switchTab('" + tab + "'"));
    }
  });

  // render per screen
  if (tab === 'home') renderHome();
  if (tab === 'dungeon') renderDungeons?.();
  if (tab === 'inventory') renderInventory?.();
  if (tab === 'collection') renderCollection?.();
}


function showWeaponInfo() {
  alert('Waffen/Items kommen in Phase 2 (Inventar & Loot).');
}
