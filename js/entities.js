function createEnemy(platform) {
    if (Math.random() > 0.05) return null;
    const roll = Math.random();
    const type = roll < 0.5 ? 1 : roll < 0.9 ? 2 : 3;
    return {
        type,
        offsetX: platform.width / 2 - 10,
        width: 20, height: 20,
        velX: type === 2 ? 1 : 0,
        shootTimer: 0, shootInterval: 120
    };
}

// Width logic: 20% narrow (55–80), 55% normal (90–110), 25% wide (140–185)
function randomPlatformWidth() {
    const r = Math.random();
    if (r < 0.20) return 55 + Math.floor(Math.random() * 26);
    if (r < 0.75) return 90 + Math.floor(Math.random() * 21);
    return 140 + Math.floor(Math.random() * 46);
}

// Returns true if any existing platform is within MIN_PLATFORM_GAP vertically of y
function tooCloseVertically(y) {
    if (tavernFloorY !== null && tavernRoofY !== null) {
        // Prevent platforms from generating inside the visual tavern interior
        if (y < tavernFloorY && y > tavernRoofY) return true;
    }
    return platforms.some(p => Math.abs(p.y - y) < MIN_PLATFORM_GAP);
}

// Returns a random x for a given width (used during init where y spacing is guaranteed)
function nonOverlapX(y, w) {
    return Math.random() * Math.max(1, canvas.width - w);
}

// For recycled platforms: find a y (stepping up in MIN_PLATFORM_GAP increments from -10)
// and a random x that fits within the canvas.
function findRecyclePos(w) {
    for (let i = 0; i < 30; i++) {
        const y = -10 - i * MIN_PLATFORM_GAP;
        if (!tooCloseVertically(y)) {
            return { x: Math.random() * Math.max(1, canvas.width - w), y };
        }
    }
    // Fallback: park it well off-screen
    return { x: Math.random() * Math.max(1, canvas.width - w), y: -10 - 30 * MIN_PLATFORM_GAP };
}

function createPlatform(x, y, forcedWidth) {
    platformCounter++;
    const width = forcedWidth !== undefined ? forcedWidth : randomPlatformWidth();
    const p = {
        x, y, width, height: 10, number: platformCounter,
        standTimer: 0, isStoodOn: false, falling: false, fallSpeed: 0
    };
    // 6% of platforms move up/down (slow)
    p.moving = Math.random() < 0.06;
    p.moveDir = 1;
    p.moveSpeed = 0.6;
    p.moveRange = 55;
    p.moveOriginY = y;
    
    // Texture logic
    if (p.moving) {
        p.sprite = 'platform_stone';
    } else {
        p.sprite = 'platform';
    }
    // 5% star powerup
    p.star = Math.random() < 0.05
        ? { offsetX: Math.floor(Math.random() * Math.max(1, width - 16)), width: 16, height: 16, collected: false }
        : null;
    // 4% spring (never on same platform as a star)
    p.spring = (!p.star && Math.random() < 0.04)
        ? { offsetX: Math.floor(Math.max(0, width / 2 - 8)), width: Math.min(16, width), height: 14 }
        : null;
    p.enemy = createEnemy(p);
    return p;
}
