const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let mouseX = 0;
let mouseY = 0;
let selectedMenuIndex = 0; // keyboard-focused menu item

const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

const gravity = 0.5;
const friction = 0.88;
const baseJump = -10;

// Minimum vertical distance (px) that must separate any two platforms
const MIN_PLATFORM_GAP = 60;

let score = 0;
let gameOver = false;
let isPaused = false;
let gameState = 'START_MENU'; // 'START_MENU', 'PLAYING', 'GAME_OVER', 'HIGH_SCORES', 'OPTIONS', 'CREDITS'
let speedMult = 1;
let starTimer = 0; // frames of star-power remaining

let highScores = JSON.parse(localStorage.getItem('greatTowerHighScores')) || [];
let coins = parseInt(localStorage.getItem('greatTowerCoins')) || 0;

// Platform numbering
let platformCounter = 0;
const AUTO_SCROLL_PLATFORM = 200;

// Bullets
let bullets = [];

// Player
let player = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    width: 20, height: 20,
    speed: 8, velX: 0, velY: 0,
    jumping: false,
    health: 3,
    maxHealth: 3,
    invTimer: 0  // invincibility frames after taking damage
};

// Platforms
let platforms = [];

// Assets and Rendering
let cameraY = 0;
let assetsLoaded = false;
let images = {};

// Tavern Logic
const TAVERN_SPAWN_PLATFORM = 100;
let tavernState = 0; // 0: Default, 1: Spawning, 2: Locked, 3: Passed
let tavernY = 0;
let tavernFloorY = null;
let tavernRoofY = null;

// Dwarf NPC Dialog
const DWARF_DIALOG_TEXT = 'Greetings, adventurer!';
const DWARF_INTERACT_RANGE = 80; // px from dwarf center that triggers "Press F"
let dwarfDialogChars = 0;       // how many chars of the bubble dialog have been revealed
let dwarfDialogActive = false;  // true once the tavern becomes visible

// Dwarf interaction panel (opened by pressing F)
const DWARF_INTERACT_LINES = [
    "Ah, a weary traveler! The tower\nstretches endlessly above...",
    "Rest here, friend. You look like\nyou could use some healing."
];
let dwarfInteracting = false;   // is the interaction panel open?
let dwarfInteractPage = 0;      // which dialog line we are on
let dwarfInteractChars = 0;     // typewriter progress for the current panel line
let dwarfInteractOption = 0;    // 0 = Rest, 1 = His Story, 2 = Leave
let dwarfHasRested = false;     // player may only rest once per tavern visit

// Story sub-dialog triggered by "His Story" option
const DWARF_STORY_LINES = [
    "My brother has gone missing\nwithin his own half-finished tower.",
    "Three days have passed\nwithout a sign.",
    "Please help me find him\nand ensure his safe return."
];
let dwarfStoryMode = false;     // true while reading the story sub-dialog
let dwarfStoryPage = 0;         // current page of the story
let dwarfStoryChars = 0;        // typewriter progress for story page

// Background Music
const bgmMenu = new Audio('usedAssets/MainMenuTheme.mp3');
bgmMenu.loop = true;
const bgmGame = new Audio('usedAssets/GameTheme.mp3');
bgmGame.loop = true;

let currentBGM = null;
let musicEnabled = true;

function updateBackgroundMusic() {
    if (!musicEnabled) return;

    const isMainMenuState = (gameState === 'START_MENU' || gameState === 'HIGH_SCORES' || gameState === 'OPTIONS' || gameState === 'CREDITS');
    let targetBGM = isMainMenuState ? bgmMenu : bgmGame;

    if (currentBGM !== targetBGM) {
        if (currentBGM) {
            currentBGM.pause();
            currentBGM.currentTime = 0;
        }
        currentBGM = targetBGM;
        if (currentBGM) {
            currentBGM.play().catch(e => {
                // Browsers block autoplay until the user interacts with the page (click/key)
                currentBGM = null; // Reset so it tries again on next update
            });
        }
    }
}
