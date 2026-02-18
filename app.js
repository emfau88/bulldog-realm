// ===============================
// Initialisierung
// ===============================

const defaultGameData = {
    selectedChar: null,
    level: 1,
    xp: 0,
    gold: 0,
    hunger: 100,
    energy: 100,
    joy: 100
};

let gameData = (window.BRState
    ? BRState.init(defaultGameData)
    : structuredClone(defaultGameData)
);

// ===============================
// Save
// ===============================

function saveGame() {
    if (window.BRState) {
        BRState.save();
    } else {
        localStorage.setItem('bulldogRealm_save', JSON.stringify(gameData));
    }
}

// ===============================
// Character Auswahl
// ===============================

function selectChar(char) {

    if (window.BRState) {
        BRState.setState({ selectedChar: char });
        gameData = BRState.getState();
    } else {
        gameData.selectedChar = char;
    }

    document.querySelectorAll('.char-card-wrapper')
        .forEach(c => c.classList.remove('selected'));

    document.querySelector('.' + char)
        .classList.add('selected');

    const btn = document.getElementById('startBtn');
    if (btn) {
        btn.classList.add('active');
        btn.disabled = false;   // ← WICHTIGER FIX
    }

    saveGame();
}

// ===============================
// Spiel Start
// ===============================

function startGame() {

    if (!gameData.selectedChar) return;

    document.getElementById('selectScreen').classList.remove('active');
    document.getElementById('homeScreen').classList.add('active');

    renderHome();
}

// ===============================
// Home Screen
// ===============================

function renderHome() {

    document.getElementById('goldValue').innerText = gameData.gold;
    document.getElementById('levelValue').innerText = gameData.level;

    document.getElementById('hungerBar').style.width = gameData.hunger + '%';
    document.getElementById('energyBar').style.width = gameData.energy + '%';
    document.getElementById('joyBar').style.width = gameData.joy + '%';
}

// ===============================
// Aktionen
// ===============================

function doAction(type) {

    switch(type) {
        case 'feed':
            gameData.hunger = Math.min(100, gameData.hunger + 10);
            break;
        case 'sleep':
            gameData.energy = Math.min(100, gameData.energy + 10);
            break;
        case 'play':
            gameData.joy = Math.min(100, gameData.joy + 10);
            break;
        case 'train':
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

// ===============================
// XP / Level
// ===============================

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

// ===============================
// Navigation
// ===============================

function showScreen(id) {

    document.querySelectorAll('.screen')
        .forEach(s => s.classList.remove('active'));

    document.getElementById(id).classList.add('active');
}

// ===============================
// Dungeon MVP
// ===============================

function enterDungeon() {

    alert("Dungeon kommt bald 👀");
    saveGame();
}

// ===============================
// Mobile Safe Autosave
// ===============================

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        saveGame();
    }
});

window.addEventListener("pagehide", saveGame);

// ===============================
// Auto Resume
// ===============================

window.addEventListener("load", () => {

    if (gameData.selectedChar) {

        document.querySelector('.' + gameData.selectedChar)?.classList.add('selected');

        const btn = document.getElementById('startBtn');
        if (btn) {
            btn.classList.add('active');
            btn.disabled = false;   // ← ebenfalls hier
        }

        startGame();
    }
});
