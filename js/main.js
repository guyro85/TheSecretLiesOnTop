function initPlatforms() {
    platformCounter = 0;
    platforms = [];
    // Safe floor: full width, no enemy, never collapses
    platforms.push({
        x: 0, y: canvas.height - 50,
        width: canvas.width, height: 10,
        number: 0,
        standTimer: 0, isStoodOn: false, falling: false, fallSpeed: 0,
        moving: false, moveDir: 1, moveSpeed: 0, moveRange: 0, moveOriginY: canvas.height - 50,
        safe: true, enemy: null, star: null, spring: null
    });
    for (let i = 1; i < 10; i++) {
        const y = canvas.height - (100 * i) - 50;
        const w = randomPlatformWidth();
        const x = nonOverlapX(y, w);
        platforms.push(createPlatform(x, y, w));
    }
}

function restartGame() {
    score = 0;
    gameOver = false;
    isPaused = false;
    gameState = 'PLAYING';
    speedMult = 1;
    starTimer = 0;
    cameraY = 0;
    tavernState = 0;
    tavernY = 0;
    tavernFloorY = null;
    tavernRoofY = null;
    dwarfDialogChars = 0;
    dwarfDialogActive = false;
    dwarfInteracting = false;
    dwarfInteractPage = 0;
    dwarfInteractChars = 0;
    dwarfInteractOption = 0;
    dwarfHasRested = false;
    dwarfStoryMode = false;
    dwarfStoryPage = 0;
    dwarfStoryChars = 0;
    bullets = [];
    keys.length = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height - 150;
    player.velX = 0;
    player.velY = 0;
    player.jumping = false;
    player.health = player.maxHealth;
    player.invTimer = 0;
    initPlatforms();
}

function spawnPostTavernPlatforms() {
    platforms = []; // Clear the tavern platforms
    // Provide a safe landing block below where the player enters, or let them just fall normally into a platform?
    // We can spawn a temporary safe floor for them to land on, then standard platforms above.
    platforms.push({
        x: canvas.width / 2 - 40, y: player.y + player.height + 20,
        width: 80, height: 10,
        number: platformCounter,
        standTimer: 0, isStoodOn: false, falling: false, fallSpeed: 0,
        moving: false, moveDir: 1, moveSpeed: 0, moveRange: 0, moveOriginY: player.y + player.height + 20,
        safe: true, enemy: null, star: null, spring: null
    });
    // Now spawn normal platforms stretching upwards
    for (let i = 1; i < 12; i++) {
        const y = player.y - (70 * i);
        const w = randomPlatformWidth();
        const x = nonOverlapX(y, w);
        platforms.push(createPlatform(x, y, w));
    }
}

let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    if (deltaTime > 250) deltaTime = 250;

    if (assetsLoaded) {
        updateBackgroundMusic();
        
        accumulator += deltaTime;
        while (accumulator >= FRAME_TIME) {
            if (gameState === 'PLAYING' && !isPaused) {
                updateGame();
            }
            accumulator -= FRAME_TIME;
        }
        drawGame();
    } else {
        // Draw loading screen
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '20px Pixelify Sans';
        ctx.textAlign = 'center';
        ctx.fillText('Loading Assets...', canvas.width / 2, canvas.height / 2);
    }

    requestAnimationFrame(gameLoop);
}

function loadImages(callback) {
    const basePath = 'usedAssets/';
    const imageFiles = {
        'knight_idle_0': 'knight_m_idle_anim_f0.png',
        'knight_idle_1': 'knight_m_idle_anim_f1.png',
        'knight_idle_2': 'knight_m_idle_anim_f2.png',
        'knight_idle_3': 'knight_m_idle_anim_f3.png',
        'knight_run_0': 'knight_m_run_anim_f0.png',
        'knight_run_1': 'knight_m_run_anim_f1.png',
        'knight_run_2': 'knight_m_run_anim_f2.png',
        'knight_run_3': 'knight_m_run_anim_f3.png',
        'muddy_0': 'muddy_anim_f0.png',
        'muddy_1': 'muddy_anim_f1.png',
        'muddy_2': 'muddy_anim_f2.png',
        'muddy_3': 'muddy_anim_f3.png',
        'orc_idle_0': 'masked_orc_idle_anim_f0.png',
        'orc_idle_1': 'masked_orc_idle_anim_f1.png',
        'orc_idle_2': 'masked_orc_idle_anim_f2.png',
        'orc_idle_3': 'masked_orc_idle_anim_f3.png',
        'orc_run_0': 'masked_orc_run_anim_f0.png',
        'orc_run_1': 'masked_orc_run_anim_f1.png',
        'orc_run_2': 'masked_orc_run_anim_f2.png',
        'orc_run_3': 'masked_orc_run_anim_f3.png',
        'pumpkin_idle_0': 'pumpkin_dude_idle_anim_f0.png',
        'pumpkin_idle_1': 'pumpkin_dude_idle_anim_f1.png',
        'pumpkin_idle_2': 'pumpkin_dude_idle_anim_f2.png',
        'pumpkin_idle_3': 'pumpkin_dude_idle_anim_f3.png',
        'pumpkin_run_0': 'pumpkin_dude_run_anim_f0.png',
        'pumpkin_run_1': 'pumpkin_dude_run_anim_f1.png',
        'pumpkin_run_2': 'pumpkin_dude_run_anim_f2.png',
        'pumpkin_run_3': 'pumpkin_dude_run_anim_f3.png',
        'wall_left': 'wall_left.png',
        'wall_mid': 'wall_mid.png',
        'wall_right': 'wall_right.png',
        'wall_hole_1': 'wall_hole_1.png',
        'wall_hole_2': 'wall_hole_2.png',
        'tavern': 'tavern.jpg',
        'main_menu_bg': 'MainMenuBG.jpg',
        'ui_heart_full': 'ui_heart_full.png',
        'ui_heart_empty': 'ui_heart_empty.png',
        'wall_banner_blue': 'wall_banner_blue.png',
        'wall_banner_red': 'wall_banner_red.png',
        'wall_banner_yellow': 'wall_banner_yellow.png',
        'wall_banner_green': 'wall_banner_green.png',
        'wall_fountain_1': 'wall_fountain_top_1.png',
        'wall_fountain_2': 'wall_fountain_top_2.png',
        'dwarf_idle_0': 'dwarf_m_idle_anim_f0.png',
        'dwarf_idle_1': 'dwarf_m_idle_anim_f1.png',
        'dwarf_idle_2': 'dwarf_m_idle_anim_f2.png',
        'dwarf_idle_3': 'dwarf_m_idle_anim_f3.png',
        'coin_0': 'coin_anim_f0.png',
        'coin_1': 'coin_anim_f1.png',
        'coin_2': 'coin_anim_f2.png',
        'coin_3': 'coin_anim_f3.png',
        'dialog_bubble': 'DialogBouble.png'
    };

    let loadedCount = 0;
    const totalImages = Object.keys(imageFiles).length;

    for (const [key, path] of Object.entries(imageFiles)) {
        const img = new Image();
        img.src = basePath + path;
        img.onload = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
                callback();
            }
        };
        img.onerror = () => {
            console.error('Failed to load image:', path);
            loadedCount++;
            if (loadedCount === totalImages) {
                callback();
            }
        };
        images[key] = img;
    }
}

// Disable image smoothing for pixel perfect sprites
ctx.imageSmoothingEnabled = false;

initPlatforms();
loadImages(() => {
    assetsLoaded = true;
});
requestAnimationFrame(gameLoop);
