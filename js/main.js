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
    speedMult = 1;
    starTimer = 0;
    bullets = [];
    keys.length = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height - 150;
    player.velX = 0;
    player.velY = 0;
    player.jumping = false;
    initPlatforms();
}

let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    if (deltaTime > 250) deltaTime = 250;
    accumulator += deltaTime;
    while (accumulator >= FRAME_TIME) {
        updateGame();
        accumulator -= FRAME_TIME;
    }
    drawGame();
    requestAnimationFrame(gameLoop);
}

initPlatforms();
requestAnimationFrame(gameLoop);
