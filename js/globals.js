const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

const gravity = 0.5;
const friction = 0.88;
const baseJump = -10;

// Minimum vertical distance (px) that must separate any two platforms
const MIN_PLATFORM_GAP = 60;

let score = 0;
let gameOver = false;
let speedMult = 1;
let starTimer = 0; // frames of star-power remaining

let highScores = JSON.parse(localStorage.getItem('greatTowerHighScores')) || [];

// Platform numbering
let platformCounter = 0;

// Bullets
let bullets = [];

// Player
let player = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    width: 20, height: 20,
    speed: 8, velX: 0, velY: 0,
    jumping: false
};

// Platforms
let platforms = [];
