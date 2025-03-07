// Game state
let state = {
    slaps: 0,
    autoSlappers: 0,
    megaSlappers: 0,
    autoSlapperCost: 10,
    megaSlapperCost: 75,
    slapsPerSecond: 0,
    slapPower: 1,
    slapPowerLevel: 0,
    slapPowerCost: 100,
    critChance: 0,
    critLevel: 0,
    critCost: 150,
    hasCustomHand: false,
    handCost: 50,
    soundEnabled: true,
    totalClicks: 0,
    lastSaveTime: Date.now()
};

// DOM elements
const slapTarget = document.getElementById('slap-target');
const slapCount = document.getElementById('slap-count');
const slapsPerSecond = document.getElementById('slaps-per-second');
const slapPowerDisplay = document.getElementById('slap-power');
const critChanceDisplay = document.getElementById('crit-chance');
const slapSound = document.getElementById('slap-sound');
const soundToggle = document.getElementById('sound-toggle');

// Shop items
const autoSlapper = document.getElementById('auto-slapper');
const autoSlapperCost = document.getElementById('auto-slapper-cost');
const autoSlapperCount = document.getElementById('auto-slapper-count');

const megaSlapper = document.getElementById('mega-slapper');
const megaSlapperCost = document.getElementById('mega-slapper-cost');
const megaSlapperCount = document.getElementById('mega-slapper-count');

const powerUpgrade = document.getElementById('power-upgrade');
const powerCost = document.getElementById('power-cost');
const powerLevel = document.getElementById('power-level');

const critUpgrade = document.getElementById('crit-upgrade');
const critCost = document.getElementById('crit-cost');
const critLevel = document.getElementById('crit-level');

const handUpgrade = document.getElementById('hand-upgrade');
const handCost = document.getElementById('hand-cost');
const handStatus = document.getElementById('hand-status');

// Initialize game
function initGame() {
    loadGame();
    updateDisplay();
    startAutoSlappers();
    startAutoSave();
}

// Add image loading error handling
slapTarget.onerror = function() {
    console.error('Error loading image');
    // Create a default target if image fails to load
    this.src = 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
            <rect width="100%" height="100%" fill="#FF6B6B"/>
            <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dy=".3em">
                Click here to slap!
            </text>
        </svg>
    `);
};

slapTarget.onload = function() {
    console.log('Image loaded successfully');
    this.style.opacity = '1';
};

// Sound toggle
soundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundToggle.textContent = `🔊 Sound: ${state.soundEnabled ? 'On' : 'Off'}`;
    saveGame();
});

// Play sound effect with debounce
const playSound = debounce(() => {
    if (state.soundEnabled && slapSound.readyState >= 2) {
        const sound = slapSound.cloneNode();
        sound.volume = 0.3;
        sound.play().catch(() => {}); // Ignore autoplay errors
        setTimeout(() => sound.remove(), 1000);
    }
}, 50);

// Show slap number with position randomization
function showSlapNumber(x, y, amount, isCritical = false) {
    const effect = document.createElement('div');
    effect.textContent = `+${amount}`;
    effect.className = 'slap-number';
    
    // Add some random offset to prevent stacking
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 40;
    
    effect.style.left = (x + offsetX) + 'px';
    effect.style.top = (y + offsetY) + 'px';
    effect.style.color = isCritical ? '#ff0000' : '#4CAF50';
    
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
}

// Manual slap with cooldown
let lastSlapTime = 0;
const SLAP_COOLDOWN = 50; // ms between slaps

slapTarget.addEventListener('click', (event) => {
    const now = Date.now();
    if (now - lastSlapTime < SLAP_COOLDOWN) return;
    lastSlapTime = now;
    
    state.totalClicks++;
    let slapAmount = state.slapPower;
    let isCritical = false;
    
    // Check for critical hit
    if (Math.random() < state.critChance / 100) {
        slapAmount *= 5;
        isCritical = true;
    }
    
    // Add slaps to total
    state.slaps += slapAmount;
    updateDisplay();
    playSound();
    
    // Show slap number
    showSlapNumber(event.clientX, event.clientY, slapAmount, isCritical);
    
    // Add animation effect
    slapTarget.style.transform = `scale(0.95) rotate(${Math.random() * 10 - 5}deg)`;
    
    // Show critical effect
    if (isCritical) {
        const critEffect = document.createElement('div');
        critEffect.textContent = 'CRITICAL!';
        critEffect.className = 'critical';
        critEffect.style.left = (event.clientX + 20) + 'px';
        critEffect.style.top = (event.clientY - 20) + 'px';
        document.body.appendChild(critEffect);
        setTimeout(() => critEffect.remove(), 1000);
    }
    
    // Reset animation
    setTimeout(() => {
        slapTarget.style.transform = 'scale(1) rotate(0deg)';
    }, 100);
});

// Auto slapper logic
function startAutoSlappers() {
    setInterval(() => {
        if (state.autoSlappers > 0 || state.megaSlappers > 0) {
            const baseAutoSlaps = state.autoSlappers + (state.megaSlappers * 5);
            let autoSlaps = baseAutoSlaps * state.slapPower;
            
            // Check for critical hits on auto slaps
            if (Math.random() < state.critChance / 100) {
                autoSlaps *= 5;
            }
            
            state.slaps += autoSlaps;
            updateDisplay();
            
            // Visual feedback for auto slaps
            if (Math.random() < 0.3) {
                const randomRotation = Math.random() * 6 - 3;
                slapTarget.style.transform = `scale(0.98) rotate(${randomRotation}deg)`;
                setTimeout(() => {
                    slapTarget.style.transform = 'scale(1) rotate(0deg)';
                }, 50);
                
                if (Math.random() < 0.3) {
                    playSound();
                }
            }
        }
    }, 1000);
}

// Shop item purchase handlers
function buyUpgrade(type) {
    const upgrades = {
        auto: {
            cost: state.autoSlapperCost,
            action: () => {
                state.autoSlappers++;
                state.autoSlapperCost = Math.floor(state.autoSlapperCost * 1.5);
            }
        },
        mega: {
            cost: state.megaSlapperCost,
            action: () => {
                state.megaSlappers++;
                state.megaSlapperCost = Math.floor(state.megaSlapperCost * 1.8);
            }
        },
        power: {
            cost: state.slapPowerCost,
            action: () => {
                state.slapPowerLevel++;
                state.slapPower *= 2;
                state.slapPowerCost = Math.floor(state.slapPowerCost * 2);
            }
        },
        crit: {
            cost: state.critCost,
            action: () => {
                state.critLevel++;
                state.critChance += 5;
                state.critCost = Math.floor(state.critCost * 1.7);
            }
        },
        hand: {
            cost: state.handCost,
            action: () => {
                state.hasCustomHand = true;
                slapTarget.classList.add('custom-cursor');
            }
        }
    };

    const upgrade = upgrades[type];
    if (upgrade && state.slaps >= upgrade.cost) {
        state.slaps -= upgrade.cost;
        upgrade.action();
        updateDisplay();
        saveGame();
        return true;
    }
    return false;
}

// Attach shop item handlers
autoSlapper.addEventListener('click', () => buyUpgrade('auto'));
megaSlapper.addEventListener('click', () => buyUpgrade('mega'));
powerUpgrade.addEventListener('click', () => buyUpgrade('power'));
critUpgrade.addEventListener('click', () => buyUpgrade('crit'));
handUpgrade.addEventListener('click', () => {
    if (!state.hasCustomHand) buyUpgrade('hand');
});

// Update display with animations
function updateDisplay() {
    const elements = {
        slapCount: Math.floor(state.slaps),
        slapsPerSecond: (state.autoSlappers + (state.megaSlappers * 5)) * state.slapPower,
        slapPower: state.slapPower,
        critChance: state.critChance,
        autoSlapperCost: state.autoSlapperCost,
        autoSlapperCount: state.autoSlappers,
        megaSlapperCost: state.megaSlapperCost,
        megaSlapperCount: state.megaSlappers,
        powerCost: state.slapPowerCost,
        powerLevel: state.slapPowerLevel,
        critCost: state.critCost,
        critLevel: state.critLevel
    };

    // Update all number displays with locale formatting
    Object.entries(elements).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
            element.textContent = typeof value === 'number' ? 
                value.toLocaleString() : value;
        }
    });

    // Update hand upgrade status
    handStatus.textContent = state.hasCustomHand ? 'Unlocked' : 'Locked';
    
    // Update shop item availability
    updateShopItemStatus(autoSlapper, state.autoSlapperCost);
    updateShopItemStatus(megaSlapper, state.megaSlapperCost);
    updateShopItemStatus(powerUpgrade, state.slapPowerCost);
    updateShopItemStatus(critUpgrade, state.critCost);
    if (!state.hasCustomHand) {
        updateShopItemStatus(handUpgrade, state.handCost);
    } else {
        handUpgrade.classList.add('disabled');
    }
}

function updateShopItemStatus(element, cost) {
    if (state.slaps >= cost) {
        element.classList.remove('disabled');
    } else {
        element.classList.add('disabled');
    }
}

// Save/Load functions
function saveGame() {
    state.lastSaveTime = Date.now();
    localStorage.setItem('slapperGameState', JSON.stringify(state));
}

function loadGame() {
    const savedState = localStorage.getItem('slapperGameState');
    if (savedState) {
        const loadedState = JSON.parse(savedState);
        
        // Calculate offline progress
        const timeDiff = (Date.now() - loadedState.lastSaveTime) / 1000; // in seconds
        if (timeDiff > 0) {
            const autoSlapsPerSecond = (loadedState.autoSlappers + (loadedState.megaSlappers * 5)) * loadedState.slapPower;
            const offlineSlaps = Math.floor(autoSlapsPerSecond * timeDiff);
            loadedState.slaps += offlineSlaps;
            
            if (offlineSlaps > 0) {
                alert(`Welcome back! You earned ${offlineSlaps.toLocaleString()} slaps while away!`);
            }
        }
        
        Object.assign(state, loadedState);
        
        if (state.hasCustomHand) {
            slapTarget.classList.add('custom-cursor');
        }
        soundToggle.textContent = `🔊 Sound: ${state.soundEnabled ? 'On' : 'Off'}`;
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Auto-save every 30 seconds
function startAutoSave() {
    setInterval(saveGame, 30000);
}

// Initialize the game
initGame(); 