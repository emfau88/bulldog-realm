const characters = {
    shadow: { 
        name: 'Shadow', 
        class: 'Dunkler Ritter', 
        image: 'https://raw.githubusercontent.com/emfau88/bulldog-realm/refs/heads/main/file_0000000009e47243a9b9c69184ce0322.png',
        atk: 85, def: 60, spd: 70, color: '#DC2626'
    },
    cotton: { 
        name: 'Cotton', 
        class: 'Wolken-Magier', 
        image: 'fluffy.png?v=2',
        atk: 60, def: 70, spd: 75, color: '#F472B6'
    },
    titan: { 
        name: 'Titan', 
        class: 'Goldener Wächter', 
        image: 'titan.png?v=2',
        atk: 70, def: 90, spd: 50, color: '#FBBF24'
    }
};

const defaultGameData = {
    selectedChar: null,
    charData: null,
    needs: { hunger: 80, energy: 100, happy: 70 },
    level: 1,
    xp: 0,
    maxXp: 100,
    gold: 100,
    gems: 5,
    equippedWeapon: { name: 'Stahlschwert', atk: 15 }
};

// Central state (hydrated from localStorage if available)
let gameData = (window.BRState ? BRState.init(defaultGameData) : structuredClone(defaultGameData));

// Particles
for(let i=0; i<15; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 15 + 's';
    p.style.animationDuration = (10 + Math.random() * 10) + 's';
    document.getElementById('bgScene').appendChild(p);
}

function selectChar(char) {
    gameData.selectedChar = char;
    document.querySelectorAll('.char-card-wrapper').forEach(c => c.classList.remove('selected'));
    document.querySelector('.' + char).classList.add('selected');
    document.getElementById('startBtn').classList.add('active');
    saveGame();
}

function startGame() {
    if(!gameData.selectedChar) return;
    
    gameData.charData = characters[gameData.selectedChar];
    
    // Setup Home Screen
    document.getElementById('homeCharImg').src = gameData.charData.image;
    document.getElementById('homeCharName').textContent = gameData.charData.name;
    
    // Setup Dungeon Screen
    document.getElementById('dgold').textContent = gameData.gold;
    document.getElementById('dgems').textContent = gameData.gems;
    
    // State already hydrated via BRState.init()
    showScreen('home');
    updateUI();
    startGameLoop();
}

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    if(screen === 'select') {
        document.getElementById('selectScreen').classList.add('active');
    } else if(screen === 'home') {
        document.getElementById('homeScreen').classList.add('active');
        updateNavActive('home');
    } else if(screen === 'dungeon') {
        document.getElementById('dungeonScreen').classList.add('active');
        updateNavActive('dungeon');
    } else if(screen === 'inventory') {
        document.getElementById('inventoryScreen').classList.add('active');
    } else if(screen === 'collection') {
        document.getElementById('collectionScreen').classList.add('active');
    }
}

function switchTab(tab) {
    if(tab === 'home') showScreen('home');
    else if(tab === 'dungeon') showScreen('dungeon');
    else if(tab === 'inventory') showScreen('inventory');
    else if(tab === 'collection') showScreen('collection');
}

function updateNavActive(active) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    // In real app would target specific buttons
}

function updateUI() {
    // Home screen bars
    document.getElementById('homeHungerBar').style.width = gameData.needs.hunger + '%';
    document.getElementById('homeHungerText').textContent = Math.round(gameData.needs.hunger) + '%';
    document.getElementById('homeEnergyBar').style.width = gameData.needs.energy + '%';
    document.getElementById('homeEnergyText').textContent = Math.round(gameData.needs.energy) + '%';
    document.getElementById('homeHappyBar').style.width = gameData.needs.happy + '%';
    document.getElementById('homeHappyText').textContent = Math.round(gameData.needs.happy) + '%';
    
    document.getElementById('homeLevel').textContent = gameData.level;
    document.getElementById('homeXpText').textContent = gameData.xp + '/' + gameData.maxXp + ' XP';
    document.getElementById('gold').textContent = gameData.gold;
    document.getElementById('gems').textContent = gameData.gems;
    
    // Mood
    let mood = '😊';
    if(gameData.needs.hunger < 30 || gameData.needs.energy < 20) mood = '😢';
    else if(gameData.needs.happy > 80) mood = '🤩';
    else if(gameData.needs.energy < 50) mood = '😴';
    else if(gameData.needs.hunger > 90) mood = '🤤';
    document.getElementById('homeMood').textContent = mood;
}

function showText(text, color) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    el.style.color = color;
    document.getElementById('charContainer').appendChild(el);
    setTimeout(() => el.remove(), 1200);
}

function addXp(amount) {
    gameData.xp += amount;
    if(gameData.xp >= gameData.maxXp) {
        gameData.level++;
        gameData.xp = 0;
        gameData.maxXp = Math.floor(gameData.maxXp * 1.5);
        showText('LEVEL UP! ⭐', '#FBBF24');
    }
    updateUI();
    saveGame();
}

// TAMAGOTCHI AKTIONEN
function performAction(action) {
    let text = '', color = '';
    
    switch(action) {
        case 'feed':
            if(gameData.needs.hunger >= 100) { 
                showText('Satt! 🍖', '#ef4444'); 
                return; 
            }
            if(gameData.gold < 10) { 
                showText('Zu wenig Gold! 🪙', '#ef4444'); 
                return; 
            }
            gameData.gold -= 10;
            gameData.needs.hunger = Math.min(100, gameData.needs.hunger + 30);
            gameData.needs.energy = Math.min(100, gameData.needs.energy + 5);
            text = '+30 🍖'; 
            color = '#f97316';
            break;
            
        case 'play':
            if(gameData.needs.energy < 20) { 
                showText('Zu müde! 😴', '#3b82f6'); 
                return; 
            }
            gameData.needs.happy = Math.min(100, gameData.needs.happy + 25);
            gameData.needs.energy -= 15;
            gameData.needs.hunger -= 10;
            text = '+25 🎭'; 
            color = '#ec4899';
            break;
            
        case 'train':
            if(gameData.needs.energy < 30) { 
                showText('Zu müde! 😴', '#3b82f6'); 
                return; 
            }
            if(gameData.needs.hunger < 20) {
                showText('Zu hungrig! 🍖', '#ef4444');
                return;
            }
            gameData.needs.energy -= 25;
            gameData.needs.hunger -= 15;
            gameData.needs.happy = Math.min(100, gameData.needs.happy + 10);
            text = '+XP 💪'; 
            color = '#FBBF24';
            addXp(25);
            break;
            
        case 'sleep':
            gameData.needs.energy = Math.min(100, gameData.needs.energy + 50);
            gameData.needs.hunger = Math.max(0, gameData.needs.hunger - 5);
            text = '+50 ⚡'; 
            color = '#06b6d4';
            break;
    }
    
    showText(text, color);
    updateUI();
    if(action !== 'train') addXp(10);
}

function showWeaponInfo() {
    showText('⚔️ ' + gameData.equippedWeapon.name + ' (+' + gameData.equippedWeapon.atk + ' ATK)', '#FBBF24');
}

function enterDungeon(level) {
    if(gameData.needs.energy < 30) {
        showText('Zu müde für Dungeon! 😴', '#ef4444');
        return;
    }
    gameData.needs.energy -= 30;
    updateUI();
    saveGame();
    showText('⚔️ Kampf gestartet!', '#FBBF24');
    // Hier käme später der Kampf-Code
}

function startGameLoop() {
    setInterval(() => {
        // Bedürfnisse sinken langsam
        gameData.needs.hunger = Math.max(0, gameData.needs.hunger - 0.5);
        gameData.needs.happy = Math.max(0, gameData.needs.happy - 0.3);
        if(gameData.needs.energy > 20) gameData.needs.energy = Math.max(20, gameData.needs.energy - 0.2);
        updateUI();
        saveGame();
    }, 5000);
}

// Speichern/Laden (mobile-safe via state.js)
function saveGame() {
    if (window.BRState) {
        BRState.saveSoon(400); // debounced
    } else {
        // Fallback (should not happen if state.js is loaded)
        try { localStorage.setItem('bulldogRealm_save_v2_fallback', JSON.stringify(gameData)); } catch (e) {}
    }
}

function loadGame() {
    // Kept for compatibility — hydration happens in BRState.init()
    return;
}

    }
}



// AUTO_RESUME: if a save exists with selectedChar, resume directly to Home.
document.addEventListener('DOMContentLoaded', () => {
    if (gameData && gameData.selectedChar) {
        // Mark selected in UI if available
        const card = document.querySelector('.' + gameData.selectedChar);
        if (card) {
            document.querySelectorAll('.char-card-wrapper').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const btn = document.getElementById('startBtn');
            if (btn) btn.classList.add('active');
        }
        startGame();
    }
});
