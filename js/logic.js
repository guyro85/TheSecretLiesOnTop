function triggerGameOver() {
    if (gameOver) return;
    gameOver = true;
    gameState = 'GAME_OVER';

    setTimeout(() => {
        if (highScores.length < 5 || score > (highScores.length > 0 ? highScores[highScores.length - 1].score : 0)) {
            let name = window.prompt("New High Score! Enter your name (max 10 chars):", "Player");
            if (name !== null) {
                name = name.trim().substring(0, 10);
                if (name === "") name = "Unknown";
                highScores.push({ name: name, score: score });
                highScores.sort((a, b) => b.score - a.score);
                if (highScores.length > 5) highScores.length = 5;
                localStorage.setItem('greatTowerHighScores', JSON.stringify(highScores));
            }
        }
    }, 50);
}

function takeDamage() {
    if (player.invTimer > 0) return; // still invincible
    player.health--;
    player.invTimer = 90; // 1.5 seconds of invincibility at 60fps
    if (player.health <= 0) {
        triggerGameOver();
    }
}

function updateGame() {
    if (gameOver) return;

    // Freeze player movement during dwarf interaction
    if (!dwarfInteracting) {
        if (keys[39]) player.velX = Math.min(player.velX + 1.5, player.speed);
        if (keys[37]) player.velX = Math.max(player.velX - 1.5, -player.speed);
        player.velX *= friction;
        player.velY += gravity;
        player.x += player.velX;
        player.y += player.velY;
    } else {
        // Bleed off velocity so player doesn't slide after chat opens
        player.velX *= 0.7;
    }

    if (starTimer > 0) starTimer--;
    if (player.invTimer > 0) player.invTimer--;

    // Bubble typewriter: activate as soon as tavern appears, reveal 1 char every ~50ms
    if (tavernState >= 1 && !dwarfDialogActive) dwarfDialogActive = true;
    if (dwarfDialogActive && dwarfDialogChars < DWARF_DIALOG_TEXT.length) {
        if (Math.floor(Date.now() / 50) !== Math.floor((Date.now() - FRAME_TIME) / 50)) {
            dwarfDialogChars = Math.min(dwarfDialogChars + 1, DWARF_DIALOG_TEXT.length);
        }
    }

    // Interaction panel typewriter: reveal chars while interacting and not on the options page
    if (dwarfInteracting && dwarfInteractPage < DWARF_INTERACT_LINES.length) {
        const target = DWARF_INTERACT_LINES[dwarfInteractPage].length;
        if (dwarfInteractChars < target) {
            if (Math.floor(Date.now() / 45) !== Math.floor((Date.now() - FRAME_TIME) / 45)) {
                dwarfInteractChars = Math.min(dwarfInteractChars + 1, target);
            }
        }
    }

    // Screen scroll
    if (player.y < canvas.height / 4) {
        const scrollAmount = Math.abs(player.velY);
        speedMult = Math.min(4, speedMult + scrollAmount * 0.015);
        score += Math.ceil(scrollAmount * speedMult * 0.5);
        player.y += scrollAmount;
        cameraY += scrollAmount; // Track camera scroll for background

        if (tavernState === 1) {
            tavernY += scrollAmount;
            if (tavernFloorY !== null) tavernFloorY += scrollAmount;
            if (tavernRoofY !== null) tavernRoofY += scrollAmount;
        }

        platforms.forEach(p => {
            p.y += scrollAmount;
            if (p.moving) p.moveOriginY += scrollAmount;
        });
        bullets.forEach(b => { b.y += scrollAmount; });
    }

    // Removed the tavern camera lock and teleport mechanisms since
    // the tavern is now traversable normally with regular scroll.

    // Decay speed multiplier
    speedMult = Math.max(1, speedMult - 0.008);

    // Move up/down platforms
    platforms.forEach(platform => {
        if (!platform.moving || platform.falling) return;

        const dy = platform.moveDir * platform.moveSpeed;
        platform.y += dy;

        if (platform.isStoodOn && !player.jumping) {
            player.y += dy;
        }

        if (Math.abs(platform.y - platform.moveOriginY) >= platform.moveRange) {
            platform.moveDir *= -1;
        }
    });

    // Move falling platforms
    platforms.forEach(platform => {
        if (!platform.falling) return;
        platform.fallSpeed += 0.3;
        platform.y += platform.fallSpeed;
    });

    // Recycle any platform that exited the bottom
    platforms.forEach(platform => {
        if (platform.y <= canvas.height + 50) return;

        platformCounter++;

        if (platformCounter === TAVERN_SPAWN_PLATFORM && tavernState === 0) {
            tavernState = 1;

            // Calculate highest (geometrically top-most) platform to place the tavern exactly 30px above
            const currentHighestY = Math.min(...platforms.map(p => p.y));

            // Calculate natural tavern dimensions
            let tW = canvas.width;
            let tH = 300;
            if (images['tavern']) {
                tH = tW * (images['tavern'].height / images['tavern'].width);
            }

            // Floor is 30px above the highest normal platform
            const floorY = currentHighestY - 30;
            // Floor is rendered 40px above the physical bottom of the image, so tavernY tracks the floor
            tavernY = floorY;
            tavernFloorY = floorY;

            // Roof is completely at the top of the image
            const roofY = floorY + 40 - tH;
            tavernRoofY = roofY;

            // Spawn Tavern Floor platform (we convert this recycled platform into the floor)
            platform.x = 0;
            platform.y = floorY;
            platform.width = canvas.width;
            platform.number = platformCounter;
            platform.standTimer = 0;
            platform.isStoodOn = false;
            platform.falling = false;
            platform.fallSpeed = 0;
            platform.safe = true;
            platform.isTavern = true;
            platform.isLadder = false;
            platform.moving = false;
            platform.moveDir = 1;
            platform.moveSpeed = 0;
            platform.moveRange = 0;
            platform.moveOriginY = platform.y;
            platform.star = null;
            platform.spring = null;
            platform.enemy = null;

            // Add invisible ladder platforms on the left wall to climb to the roof
            // Gap should be ~60px
            const ladderCount = Math.max(0, Math.floor((floorY - roofY) / 60) - 1);
            for (let i = 1; i <= ladderCount; i++) {
                const lY = floorY - (60 * i);
                platforms.push({
                    x: 60, y: lY, width: 40, height: 10,
                    number: ++platformCounter, standTimer: 0, isStoodOn: false, falling: false, fallSpeed: 0,
                    safe: true, isLadder: true, isTavern: true, moving: false, moveDir: 1, moveSpeed: 0, moveRange: 0, moveOriginY: lY,
                    star: null, spring: null, enemy: null
                });
            }

            // Directly push the Roof platform (so it spawns immediately)
            platforms.push({
                x: 0, y: roofY, width: canvas.width, height: 10,
                number: ++platformCounter, standTimer: 0, isStoodOn: false, falling: false, fallSpeed: 0,
                safe: true, isTavern: true, isLadder: false, moving: false, moveDir: 1, moveSpeed: 0, moveRange: 0, moveOriginY: roofY,
                star: null, spring: null, enemy: null
            });

            // Add one immediate extra platform EXACTLY 30px above the newly spawned roof
            platforms.push({
                x: nonOverlapX(roofY - 30, 80), y: roofY - 30, width: 80, height: 10,
                number: ++platformCounter, standTimer: 0, isStoodOn: false, falling: false, fallSpeed: 0,
                safe: true, isTavern: false, isLadder: false, moving: false, moveDir: 1, moveSpeed: 0, moveRange: 0, moveOriginY: roofY - 30,
                star: null, spring: null, enemy: null
            });

            return;
        }

        const newW = randomPlatformWidth();
        const pos = findRecyclePos(newW);
        platform.x = pos.x;
        platform.y = pos.y;
        platform.width = newW;
        platform.number = platformCounter;
        platform.standTimer = 0;
        platform.isStoodOn = false;
        platform.falling = false;
        platform.fallSpeed = 0;
        platform.safe = false;
        platform.isTavern = false;
        platform.isLadder = false;
        platform.moving = Math.random() < 0.06;
        platform.moveDir = 1;
        platform.moveSpeed = 0.6;
        platform.moveRange = 55;
        platform.moveOriginY = platform.y;
        platform.star = Math.random() < 0.05
            ? { offsetX: Math.floor(Math.random() * Math.max(1, newW - 16)), width: 16, height: 16, collected: false }
            : null;
        platform.spring = (!platform.star && Math.random() < 0.04)
            ? { offsetX: Math.floor(Math.max(0, newW / 2 - 8)), width: Math.min(16, newW), height: 14 }
            : null;
        platform.enemy = createEnemy(platform);
    });

    // Canvas edges: wall bounce
    if (player.x >= canvas.width - player.width) {
        player.x = canvas.width - player.width;
        player.velX = -Math.abs(player.velX) * 1.1;
    } else if (player.x <= 0) {
        player.x = 0;
        player.velX = Math.abs(player.velX) * 1.1;
    }
    player.velX = Math.max(-player.speed, Math.min(player.speed, player.velX));

    // Death: fell off bottom
    if (player.y >= canvas.height - player.height) {
        triggerGameOver();
        return;
    }

    // Reset stood-on flags
    platforms.forEach(p => { p.isStoodOn = false; });

    // Platform collision
    platforms.forEach(platform => {
        if (platform.falling) return;
        const playerBottom = player.y + player.height;
        const prevPlayerBottom = playerBottom - player.velY;
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            prevPlayerBottom <= platform.y + 2 && // 2px leniency for floating point translation errors
            playerBottom >= platform.y &&
            player.velY > 0
        ) {
            // Spring check: if landing within the spring's x range, super-bounce
            const sp = platform.spring;
            if (sp) {
                const sx = platform.x + sp.offsetX;
                if (player.x + player.width > sx && player.x < sx + sp.width) {
                    player.jumping = true;
                    player.velY = -22;
                    player.y = platform.y - player.height;
                    return;
                }
            }
            // Normal land
            player.jumping = false;
            player.velY = 0;
            player.y = platform.y - player.height;
            platform.isStoodOn = true;
        }
    });

    // Star collection
    platforms.forEach(platform => {
        const st = platform.star;
        if (!st || st.collected) return;
        const sx = platform.x + st.offsetX;
        const sy = platform.y - st.height;
        if (
            player.x < sx + st.width &&
            player.x + player.width > sx &&
            player.y < sy + st.height &&
            player.y + player.height > sy
        ) {
            st.collected = true;
            starTimer = 360; // 6 seconds at 60 fps
        }
    });

    // Stand timer: fall after 4 seconds (safe platform immune)
    platforms.forEach(platform => {
        if (platform.falling || platform.safe) return;
        if (platform.isStoodOn) {
            platform.standTimer += FRAME_TIME;
            if (platform.standTimer >= 4000) platform.falling = true;
        } else {
            platform.standTimer = 0;
        }
    });

    updateEnemies();
    updateBullets();
}

function updateEnemies() {
    platforms.forEach(platform => {
        const e = platform.enemy;
        if (!e) return;

        // Type 2: move side to side within platform bounds
        if (e.type === 2) {
            e.offsetX += e.velX;
            if (e.offsetX <= 0) { e.offsetX = 0; e.velX = 1; }
            if (e.offsetX + e.width >= platform.width) { e.offsetX = platform.width - e.width; e.velX = -1; }
        }

        // Type 3: shoot toward player every shootInterval frames
        if (e.type === 3) {
            e.shootTimer++;
            if (e.shootTimer >= e.shootInterval) {
                e.shootTimer = 0;
                const ex = platform.x + e.offsetX + e.width / 2;
                const ey = platform.y - e.height / 2;
                const dx = (player.x + player.width / 2) - ex;
                const dy = (player.y + player.height / 2) - ey;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                bullets.push({ x: ex, y: ey, velX: dx / dist * 3, velY: dy / dist * 3, r: 4 });
            }
        }

        // Collision: star power kills enemy; otherwise take damage
        const ex = platform.x + e.offsetX;
        const ey = platform.y - e.height;
        if (!gameOver &&
            player.x < ex + e.width &&
            player.x + player.width > ex &&
            player.y < ey + e.height &&
            player.y + player.height > ey
        ) {
            if (starTimer > 0) {
                platform.enemy = null;
            } else {
                takeDamage();
            }
        }
    });
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.velX;
        b.y += b.velY;

        // Remove if off-screen
        if (b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) {
            bullets.splice(i, 1);
            continue;
        }

        // Collision: bullet touches player → take damage
        if (!gameOver &&
            player.x < b.x + b.r &&
            player.x + player.width > b.x - b.r &&
            player.y < b.y + b.r &&
            player.y + player.height > b.y - b.r
        ) {
            takeDamage();
            bullets.splice(i, 1);
        }
    }
}
