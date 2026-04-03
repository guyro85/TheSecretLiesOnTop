// Draw a 5-pointed star centred at (cx, cy) with outer radius r
function drawStarShape(cx, cy, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI / 5) - Math.PI / 2;
        const radius = (i % 2 === 0) ? r : r * 0.4;
        const px = cx + radius * Math.cos(angle);
        const py = cy + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
}

let menuButtons = []; // Stores hitboxes for current menu text buttons

function drawMenuBackground() {
    if (images['main_menu_bg']) {
        ctx.drawImage(images['main_menu_bg'], 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawMenuTitle(title) {
    ctx.textAlign = 'center';
    ctx.font = '64px alagard';
    const lines = title.toUpperCase().split('\n');
    const lineHeight = 64;

    // Shift up slightly to accommodate multiple lines
    let startY = lines.length > 1 ? 110 : 140;

    lines.forEach((line, i) => {
        const y = startY + (i * lineHeight);
        const cx = canvas.width / 2;

        // 2px Pixel Outline (simulating the 4 drop-shadows requested)
        ctx.fillStyle = '#221B1B';
        ctx.fillText(line, cx + 2, y);
        ctx.fillText(line, cx - 2, y);
        ctx.fillText(line, cx, y + 2);
        ctx.fillText(line, cx, y - 2);

        // The Gradient (Top to Bottom)
        // Canvas gradient goes from y-55 (top of text) to y (bottom of text baseline approx)
        const gradient = ctx.createLinearGradient(0, y - 55, 0, y);
        gradient.addColorStop(0.2, '#F5E1C1');
        gradient.addColorStop(0.5, '#D9A066');
        gradient.addColorStop(0.9, '#8F563B');

        ctx.fillStyle = gradient;
        ctx.fillText(line, cx, y);
    });
}

function drawTextButtons(buttons, startY, spacing) {
    menuButtons = [];
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px ' + (document.fonts.check('12px "Pixelify Sans"') ? 'Pixelify Sans' : 'sans-serif');

    buttons.forEach((btn, index) => {
        const y = startY + index * spacing;
        const width = ctx.measureText(btn.text).width;
        const height = 30; // Approximation of font height

        // Base coordinate
        const boxX = canvas.width / 2 - width / 2;
        const boxY = y - 24; // Text drawn from bottom up roughly

        // Check hover (mouse)
        const isMouseHovered = (mouseX >= boxX && mouseX <= boxX + width &&
            mouseY >= boxY && mouseY <= boxY + height);

        // If mouse is hovering this button, sync keyboard selection index to it
        if (isMouseHovered) selectedMenuIndex = index;

        const isSelected = isMouseHovered || selectedMenuIndex === index;
        const drawY = isSelected ? y - 3 : y;

        // Define hitbox for this button
        menuButtons.push({
            text: btn.text,
            action: btn.action,
            x: boxX,
            y: boxY,
            width: width,
            height: height
        });

        ctx.fillStyle = isSelected ? '#FFD700' : 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(btn.text, canvas.width / 2, drawY);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    });
}

function drawMainMenu() {
    drawMenuBackground();
    drawMenuTitle('The Secret\nLies On Top');

    const buttons = [
        { text: 'Start Game', action: () => { restartGame(); } },
        { text: 'Store', action: () => { gameState = 'STORE'; selectedMenuIndex = 0; } },
        { text: 'High Scores', action: () => { gameState = 'HIGH_SCORES'; selectedMenuIndex = 0; } },
        { text: 'Options', action: () => { gameState = 'OPTIONS'; selectedMenuIndex = 0; } },
        { text: 'Credits', action: () => { gameState = 'CREDITS'; selectedMenuIndex = 0; } },
        { text: 'Quit', action: () => { location.reload(); } }
    ];
    drawTextButtons(buttons, 220, 40);

    const pTimer = Math.floor(Date.now() / 150) % 4;
    const spriteName = `${currentSkinId}_idle_${pTimer}`;
    if (images && images[spriteName]) {
        const drawSize = 64;
        const px = canvas.width / 2 - drawSize / 2;
        const py = canvas.height - 30 - drawSize;
        ctx.drawImage(images[spriteName], px, py, drawSize, drawSize);

        // Name of the skin above it
        const currentSkinData = AVAILABLE_SKINS.find(s => s.id === currentSkinId);
        ctx.font = '16px Pixelify Sans';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText(currentSkinData ? currentSkinData.name : 'Unknown', canvas.width / 2, py - 5);

        // Arrows to cycle through owned skins
        if (ownedSkins.length > 1) {
            ctx.font = 'bold 24px Pixelify Sans';
            ctx.fillStyle = 'white';
            ctx.fillText('<', px - 20, py + drawSize / 2 + 10);
            ctx.fillText('>', px + drawSize + 20, py + drawSize / 2 + 10);

            // Note: Clicks for these are handled in input.js
            // Define hotzones globally for input.js to easily grab
            window.skinLeftArrowRect = { x: px - 35, y: py + drawSize / 2 - 20, w: 30, h: 40 };
            window.skinRightArrowRect = { x: px + drawSize + 5, y: py + drawSize / 2 - 20, w: 30, h: 40 };
        }
    }
}

function drawStoreMenu() {
    drawMenuBackground();
    drawMenuTitle('Store');

    // Title / Coins
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Pixelify Sans';
    ctx.textAlign = 'right';
    ctx.fillText('Coins: ' + coins, canvas.width - 20, 30);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(20, 100, canvas.width - 40, canvas.height - 180);

    // Render Back Button first to initialize the menuButtons hit array naturally
    drawTextButtons([{ text: 'Back', action: () => { gameState = 'START_MENU'; selectedMenuIndex = 0; } }], canvas.height - 60, 40);

    // Now manually mount store cards and inject their hitzones
    const startY = 120;
    const rowHeight = 70;

    AVAILABLE_SKINS.forEach((skin, idx) => {
        const isOwned = ownedSkins.includes(skin.id);
        const y = startY + idx * rowHeight;
        const x = 40;
        const w = canvas.width - 80;
        const h = 60;

        // Visual hover check
        const isHovered = (typeof mouseX !== 'undefined' && mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h);

        // Draw card background
        ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = isOwned ? '#FFD700' : '#888';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Draw sprite animation preview
        const pTimer = Math.floor(Date.now() / 150) % 4;
        const spriteName = `${skin.id}_idle_${pTimer}`;
        if (images[spriteName]) {
            ctx.drawImage(images[spriteName], x + 10, y + 10, 40, 40);
        }

        // Draw character name
        ctx.textAlign = 'left';
        ctx.font = '20px Pixelify Sans';
        ctx.fillStyle = 'white';
        ctx.fillText(skin.name, x + 60, y + 27);

        // Draw cost / status string
        ctx.font = 'bold 16px Pixelify Sans';
        if (isOwned) {
            ctx.fillStyle = '#00FF00'; // Green text
            ctx.fillText('Owned', x + 60, y + 47);
        } else {
            ctx.fillStyle = coins >= skin.cost ? '#FFD700' : '#FF4444';
            ctx.fillText(`${skin.cost} Coins`, x + 60, y + 47);

            // Draw mini coin icon spinner next to the price
            const uiCFrame = Math.floor(Date.now() / 150) % 4;
            if (images[`coin_${uiCFrame}`]) {
                const textWidth = ctx.measureText(`${skin.cost} Coins`).width;
                ctx.drawImage(images[`coin_${uiCFrame}`], x + 65 + textWidth, y + 34, 14, 14);
            }
        }

        // Intercept inputs securely simulating typical drawing behavior
        menuButtons.push({
            action: () => {
                if (!isOwned && coins >= skin.cost) {
                    coins -= skin.cost;
                    ownedSkins.push(skin.id);
                    localStorage.setItem('greatTowerCoins', coins.toString());
                    localStorage.setItem('greatTowerOwnedSkins', JSON.stringify(ownedSkins));
                    currentSkinId = skin.id; // Optional: auto equip on purchase
                    localStorage.setItem('greatTowerCurrentSkin', currentSkinId);
                }
            },
            x: x,
            y: y,
            width: w,
            height: h
        });
    });
}

function drawHighScoresMenu() {
    drawMenuBackground();
    drawMenuTitle('High Scores');

    ctx.fillRect(50, 170, canvas.width - 100, 250);

    let startY = 210;
    ctx.textAlign = 'center';
    if (highScores.length === 0) {
        ctx.font = '20px ' + (document.fonts.check('12px "Pixelify Sans"') ? 'Pixelify Sans' : 'sans-serif');
        ctx.fillStyle = 'white';
        ctx.fillText('No high scores yet!', canvas.width / 2, startY);
    } else {
        let bestScore = highScores[0].score;
        highScores.forEach((entry, index) => {
            let text = `${index + 1}. ${entry.name} - ${entry.score}`;
            if (entry.score === bestScore) {
                ctx.font = 'bold 22px ' + (document.fonts.check('12px "Pixelify Sans"') ? 'Pixelify Sans' : 'sans-serif');
                ctx.fillStyle = '#FFD700';
            } else {
                ctx.font = '20px ' + (document.fonts.check('12px "Pixelify Sans"') ? 'Pixelify Sans' : 'sans-serif');
                ctx.fillStyle = 'white';
            }
            ctx.fillText(text, canvas.width / 2, startY + (index * 40));
        });
    }

    const buttons = [{ text: 'Back', action: () => { gameState = 'START_MENU'; } }];
    drawTextButtons(buttons, 470, 45);
}

function drawOptionsMenu() {
    drawMenuBackground();
    drawMenuTitle('Options');

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(50, 170, canvas.width - 100, 230);

    const buttons = [
        {
            text: 'Music: ' + (musicEnabled ? 'On' : 'Off'),
            action: () => {
                musicEnabled = !musicEnabled;
                if (!musicEnabled && currentBGM) {
                    currentBGM.pause();
                    currentBGM.currentTime = 0;
                    currentBGM = null;
                }
            }
        },
        {
            text: 'SFX: On (WIP)',
            action: () => { }
        },
        {
            text: 'Controls: Auto',
            action: () => { }
        },
        {
            text: 'Back',
            action: () => { gameState = 'START_MENU'; selectedMenuIndex = 0; }
        }
    ];

    drawTextButtons(buttons, 210, 50);
}

function drawCreditsMenu() {
    drawMenuBackground();
    drawMenuTitle('Credits');

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(50, 170, canvas.width - 100, 200);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '20px ' + (document.fonts.check('12px "Pixelify Sans"') ? 'Pixelify Sans' : 'sans-serif');
    ctx.fillText('Created by:', canvas.width / 2, 210);
    ctx.font = 'bold 24px ' + (document.fonts.check('12px "Pixelify Sans"') ? 'Pixelify Sans' : 'sans-serif');
    ctx.fillStyle = '#FFD700';
    ctx.fillText('Bigfoot Studios', canvas.width / 2, 250);

    ctx.fillStyle = 'white';
    ctx.font = '20px ' + (document.fonts.check('12px "Pixelify Sans"') ? 'Pixelify Sans' : 'sans-serif');
    ctx.fillText('Assets: Robert', canvas.width / 2, 300);
    ctx.fillText('Programming: Guy', canvas.width / 2, 330);

    const buttons = [{ text: 'Back', action: () => { gameState = 'START_MENU'; selectedMenuIndex = 0; } }];
    drawTextButtons(buttons, 440, 45);
}

function drawInstructionsMenu() {
    drawMenuBackground();
    drawMenuTitle('How to Play');

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(50, 160, canvas.width - 100, 220);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '18px ' + (document.fonts.check('12px "Pixelify Sans"') ? 'Pixelify Sans' : 'sans-serif');

    ctx.fillText('1. Left/Right or A/D to move.', canvas.width / 2, 200);
    ctx.fillText('2. Up, W, or Space to jump.', canvas.width / 2, 240);
    ctx.fillText('3. Avoid the enemies.', canvas.width / 2, 280);
    ctx.fillText('4. Collect stars for invincibility.', canvas.width / 2, 320);
    ctx.fillText('5. Find the tavern to rest!', canvas.width / 2, 360);

    const backAction = () => {
        if (isPaused) {
            gameState = 'PLAYING';
        } else {
            gameState = 'START_MENU';
        }
        selectedMenuIndex = 0;
    };

    const buttons = [{ text: 'Back', action: backAction }];
    drawTextButtons(buttons, 440, 45);
}

function drawGame() {
    if (gameState === 'START_MENU') {
        drawMainMenu();
    } else if (gameState === 'STORE') {
        drawStoreMenu();
    } else if (gameState === 'HIGH_SCORES') {
        drawHighScoresMenu();
    } else if (gameState === 'OPTIONS') {
        drawOptionsMenu();
    } else if (gameState === 'CREDITS') {
        drawCreditsMenu();
    } else if (gameState === 'INSTRUCTIONS') {
        drawInstructionsMenu();
    } else {
        drawGameplay();
    }
}

function drawGameplay() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background tiles
    const tileSize = 32;
    // We want the background to scroll down as the player goes up.
    // cameraY increases as we go up.
    // The tiles move down by (cameraY % tileSize)
    const offsetY = Math.floor(cameraY) % tileSize;

    // Fill background with wall tiles + decorations
    const wallDecorations = [
        'wall_banner_blue', 'wall_banner_red', 'wall_banner_yellow', 'wall_banner_green',
        'wall_fountain_1', 'wall_fountain_2'
    ];
    for (let y = -tileSize + offsetY; y < canvas.height; y += tileSize) {
        const logicalRow = Math.floor((Math.floor(cameraY) - y) / tileSize);

        // Draw left wall
        if (images['wall_left']) ctx.drawImage(images['wall_left'], 0, y, tileSize, tileSize);

        // Left wall decoration (rare, skip tavern)
        const inTavernZone = tavernState >= 1 && tavernFloorY !== null &&
            y >= (tavernRoofY - 10) && y <= (tavernFloorY + 20);
        if (!inTavernZone) {
            const leftNoise = Math.abs(Math.sin(logicalRow * 47.9898 + 3.1) * 43758.5453);
            const leftR = leftNoise - Math.floor(leftNoise);
            if (leftR > 0.97) {
                const decorIdx = Math.floor(leftR * 100) % wallDecorations.length;
                const decorKey = wallDecorations[decorIdx];
                if (images[decorKey]) ctx.drawImage(images[decorKey], 0, y, tileSize, tileSize);
            }
        }

        // Draw middle walls
        if (images['wall_mid']) {
            for (let x = tileSize; x < canvas.width - tileSize; x += tileSize) {
                const logicalCol = Math.floor(x / tileSize);
                const noise = Math.abs(Math.sin(logicalRow * 12.9898 + logicalCol * 78.233) * 43758.5453);
                const r = noise - Math.floor(noise);

                let tileToDraw = images['wall_mid'];
                if (r > 0.95 && images['wall_hole_1']) tileToDraw = images['wall_hole_1'];
                else if (r > 0.90 && images['wall_hole_2']) tileToDraw = images['wall_hole_2'];

                ctx.drawImage(tileToDraw, x, y, Math.min(tileSize, canvas.width - tileSize - x), tileSize);
            }
        }

        // Draw right wall
        if (images['wall_right']) ctx.drawImage(images['wall_right'], canvas.width - tileSize, y, tileSize, tileSize);

        // Right wall decoration (rare, skip tavern)
        if (!inTavernZone) {
            const rightNoise = Math.abs(Math.sin(logicalRow * 83.7264 + 7.5) * 43758.5453);
            const rightR = rightNoise - Math.floor(rightNoise);
            if (rightR > 0.97) {
                const decorIdx = Math.floor(rightR * 100) % wallDecorations.length;
                const decorKey = wallDecorations[decorIdx];
                if (images[decorKey]) {
                    ctx.save();
                    ctx.translate(canvas.width - tileSize + tileSize / 2, y + tileSize / 2);
                    ctx.scale(-1, 1);
                    ctx.drawImage(images[decorKey], -tileSize / 2, -tileSize / 2, tileSize, tileSize);
                    ctx.restore();
                }
            }
        }
    }

    // Draw Tavern if active
    if (tavernState === 1 || tavernState === 2) {
        if (images['tavern']) {
            const aspect = images['tavern'].height / images['tavern'].width;
            const tW = canvas.width;
            const tH = tW * aspect;
            // Draw sitting perfectly on the floor (tavernY is the visual floor, bottom is 40px below the floor)
            ctx.drawImage(images['tavern'], 0, tavernY - tH + 40, tW, tH);
        }

        // Draw tavern dwarf NPC (idle animated, sits on the tavern floor, no damage on contact)
        if (tavernFloorY !== null) {
            const dFrame = Math.floor(Date.now() / 150) % 4;
            const dSprite = images[`dwarf_idle_${dFrame}`];
            const dSize = 40;
            const dX = canvas.width - 40 - dSize; // 40px from the right wall
            const dY = tavernFloorY - dSize;
            const dCenterX = dX + dSize / 2;

            if (dSprite) {
                // Flip horizontally to face left
                ctx.save();
                ctx.translate(dX + dSize / 2, dY + dSize / 2);
                ctx.scale(-1, 1);
                ctx.drawImage(dSprite, -dSize / 2, -dSize / 2, dSize, dSize);
                ctx.restore();
            }

            // Dialog bubble (appears as soon as tavern is active)
            if (dwarfDialogActive && images['dialog_bubble']) {
                const bubW = 130;
                const bubH = 50;
                const bubX = dCenterX - bubW / 2;
                const bubY = dY - bubH - 8; // 8px gap above dwarf

                // Bubble image (stretched to desired size, maintains pixel-art feel)
                ctx.drawImage(images['dialog_bubble'], bubX, bubY, bubW, bubH);

                // Typewriter text clipped to revealed chars
                const visibleText = DWARF_DIALOG_TEXT.substring(0, dwarfDialogChars);
                ctx.save();
                ctx.font = '9px Pixelify Sans';
                ctx.fillStyle = '#1a0a00';
                ctx.textAlign = 'center';

                // Word-wrap into two lines for narrow bubble
                const words = visibleText.split(' ');
                let line1 = '', line2 = '';
                let switched = false;
                for (const w of words) {
                    const testLine = (switched ? line2 : line1) + (((switched ? line2 : line1) ? ' ' : '') + w);
                    if (!switched && ctx.measureText(testLine).width > bubW - 16) {
                        switched = true;
                        line2 = w;
                    } else if (switched) {
                        line2 += (line2 ? ' ' : '') + w;
                    } else {
                        line1 = testLine;
                    }
                }
                const textCX = dCenterX;
                if (line2) {
                    ctx.fillText(line1, textCX, bubY + 19);
                    ctx.fillText(line2, textCX, bubY + 31);
                } else {
                    ctx.fillText(line1, textCX, bubY + 25);
                }
                ctx.restore();
            }

            // "Press F" proximity prompt
            const playerCenterX = player.x + player.width / 2;
            const dist = Math.abs(playerCenterX - dCenterX);
            if (dist <= DWARF_INTERACT_RANGE && tavernState >= 1) {
                ctx.save();
                ctx.font = 'bold 16px Pixelify Sans';
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.textAlign = 'center';
                const promptY = dY - (dwarfDialogActive && images['dialog_bubble'] ? 68 : 12);
                ctx.strokeText('Press F', dCenterX, promptY);
                ctx.fillText('Press F', dCenterX, promptY);
                ctx.restore();
            }
        }
    }

    // Draw platforms
    platforms.forEach(platform => {
        // Skip rendering invisible hitboxes for the tavern
        if (platform.isLadder || platform.isTavern) return;

        const sprKey = platform.sprite || 'platform';
        if (images[sprKey]) {
            ctx.drawImage(images[sprKey], platform.x, platform.y, platform.width, platform.height);
            // Red warning tint for falling platforms
            if (platform.falling) {
                ctx.fillStyle = 'rgba(255, 50, 50, 0.4)';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            }
        } else {
            // Fallback Colour: falling=Tomato, moving=Steel Blue, normal=Tan
            ctx.fillStyle = platform.falling ? '#FF6347' : platform.moving ? '#4682B4' : '#D2B48C';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }

        // Warning bar
        if (!platform.falling && platform.standTimer > 0) {
            const pct = platform.standTimer / 4000;
            ctx.fillStyle = pct < 0.5 ? '#FFA500' : '#FF4500';
            ctx.fillRect(platform.x, platform.y - 4, platform.width * pct, 3);
        }

        // Floor label on multiples of 10
        if (platform.number > 0 && platform.number % 10 === 0) {
            ctx.save();
            ctx.font = '13px Pixelify Sans';
            ctx.textAlign = 'center';

            const label = 'FLOOR ' + platform.number;
            const cx = platform.x + platform.width / 2;
            const cy = platform.y + 24; // Hand cleanly beneath the platform

            // Exact 1px offset outline (much cleaner than strokeText for small fonts)
            ctx.fillStyle = '#111';
            ctx.fillText(label, cx + 1, cy);
            ctx.fillText(label, cx - 1, cy);
            ctx.fillText(label, cx, cy + 1);
            ctx.fillText(label, cx, cy - 1);

            // Fill
            ctx.fillStyle = '#FFD700';
            ctx.fillText(label, cx, cy);

            ctx.restore();
        }

        // Spring: green coil on top of platform
        if (platform.spring) {
            const sp = platform.spring;
            const sx = platform.x + sp.offsetX;
            const sy = platform.y - sp.height;
            ctx.fillStyle = '#22BB22';
            ctx.fillRect(sx, sy + 4, sp.width, sp.height - 4);
            ctx.fillStyle = '#004400';
            ctx.fillRect(sx, sy, sp.width, 4);
            ctx.strokeStyle = '#66FF66';
            ctx.lineWidth = 1;
            for (let li = 1; li <= 3; li++) {
                const ly = sy + 4 + (li * (sp.height - 4) / 4);
                ctx.beginPath();
                ctx.moveTo(sx + 2, ly);
                ctx.lineTo(sx + sp.width - 2, ly);
                ctx.stroke();
            }
        }

        // Star powerup: golden star floating above platform
        if (platform.star && !platform.star.collected) {
            const st = platform.star;
            const cx = platform.x + st.offsetX + st.width / 2;
            const cy = platform.y - st.height / 2;
            drawStarShape(cx, cy, 8, '#FFD700');
        }

        // Coin collectible
        if (platform.coin && !platform.coin.collected) {
            const co = platform.coin;
            const cFrame = Math.floor(Date.now() / 150) % 4;
            const cSprite = images[`coin_${cFrame}`];
            if (cSprite) {
                ctx.drawImage(cSprite, platform.x + co.offsetX, platform.y - co.height, co.width, co.height);
            }
        }
    });

    // Draw enemies
    const frameIndex = Math.floor(Date.now() / 150) % 4; // 4 frame animation
    platforms.forEach(platform => {
        const e = platform.enemy;
        if (!e) return;
        const ex = platform.x + e.offsetX;
        const ey = platform.y - e.height;

        // Ensure width/height ratio makes sense, or adjust drawn size
        // Hitboxes are 20x20. We draw sprites slightly larger (32x32).
        const drawSizes = 32;
        const drawPx = ex + (e.width / 2) - (drawSizes / 2);
        const drawPy = ey + e.height - drawSizes + 2; // +2 to let them touch the platform nicely

        let spriteName = '';
        let flip = false;

        if (e.type === 1) { // Muddy
            spriteName = `muddy_${frameIndex}`;
        } else if (e.type === 2) { // Masked Orc (Moves side to side)
            flip = e.velX > 0;
            spriteName = e.velX !== 0 ? `orc_run_${frameIndex}` : `orc_idle_${frameIndex}`;
        } else if (e.type === 3) { // Pumpkin Dude
            spriteName = `pumpkin_idle_${frameIndex}`;
        }

        if (images[spriteName]) {
            if (flip) {
                ctx.save();
                ctx.translate(ex + e.width / 2, ey + e.height / 2);
                ctx.scale(-1, 1);
                ctx.drawImage(images[spriteName], -drawSizes / 2, drawPy - (ey + e.height / 2), drawSizes, drawSizes);
                ctx.restore();
            } else {
                ctx.drawImage(images[spriteName], drawPx, drawPy, drawSizes, drawSizes);
            }
        } else {
            // Fallback
            const enemyColors = { 1: '#8B0000', 2: '#CC4400', 3: '#6600CC' };
            ctx.fillStyle = enemyColors[e.type] || 'purple';
            ctx.fillRect(ex, ey, e.width, e.height);
        }
    });

    // Draw bullets
    ctx.fillStyle = '#FF2200';
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw player
    const pTimer = Math.floor(Date.now() / 150) % 4;
    const isRunning = Math.abs(player.velX) > 0.5;
    const pSpriteName = isRunning ? `${currentSkinId}_run_${pTimer}` : `${currentSkinId}_idle_${pTimer}`;

    // Default size and drawing positions for 32x32 sprite covering a 20x20 hitbox
    const pDrawSizes = 32;
    const pDrawPx = player.x + (player.width / 2) - (pDrawSizes / 2);
    // Align feet
    const pDrawPy = player.y + player.height - pDrawSizes + 2;

    // Flashes gold while star power is active
    if (starTimer > 0 && Math.floor(starTimer / 6) % 2 === 0) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    if (images[pSpriteName]) {
        // Player turns around when moving left
        let flipPlayer = player.velX < -0.1;
        if (flipPlayer) {
            ctx.save();
            ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(images[pSpriteName], -pDrawSizes / 2, pDrawPy - (player.y + player.height / 2), pDrawSizes, pDrawSizes);
            ctx.restore();
        } else {
            ctx.drawImage(images[pSpriteName], pDrawPx, pDrawPy, pDrawSizes, pDrawSizes);
        }
    } else {
        ctx.fillStyle = (starTimer > 0 && Math.floor(starTimer / 6) % 2 === 0) ? '#FFD700' : 'red';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Red damage glow while invincible
    if (player.invTimer > 0) {
        const glowAlpha = (player.invTimer / 90) * 0.55; // fades out over the invincibility window
        ctx.globalAlpha = glowAlpha;
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    // === UI LAYER (always on top) ===
    // HUD - Score & Speed (left side)
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(5, 5, 165, starTimer > 0 ? 75 : 55);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Pixelify Sans';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 12, 26);
    ctx.font = '13px Pixelify Sans';
    ctx.fillStyle = speedMult > 1.5 ? '#FFD700' : '#aaa';
    ctx.fillText('Speed \xd7' + speedMult.toFixed(1), 12, 48);
    if (starTimer > 0) {
        drawStarShape(22, 64, 8, '#FFD700');
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 13px Pixelify Sans';
        ctx.textAlign = 'left';
        ctx.fillText(Math.ceil(starTimer / 60) + 's', 36, 69);
    }

    // HUD - Coins (top right, directly left of hearts)
    const coinsRightX = canvas.width - (player.maxHealth * 23) - 10;
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px Pixelify Sans';

    // Smooth pixel shadow for text
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(coins.toString(), coinsRightX, 24);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Coin Icon
    const uiCFrame = Math.floor(Date.now() / 150) % 4;
    const uiCSprite = images[`coin_${uiCFrame}`];
    const textWidth = ctx.measureText(coins.toString()).width;
    if (uiCSprite) {
        ctx.drawImage(uiCSprite, coinsRightX - textWidth - 24, 7, 20, 20);
    }

    // HUD - Hearts (top right)
    const heartSize = 20;
    const heartPad = 3;
    for (let i = 0; i < player.maxHealth; i++) {
        const hx = canvas.width - (player.maxHealth - i) * (heartSize + heartPad) - 5;
        const hy = 8;
        const heartKey = i < player.health ? 'ui_heart_full' : 'ui_heart_empty';
        if (images[heartKey]) {
            ctx.drawImage(images[heartKey], hx, hy, heartSize, heartSize);
        } else {
            // Fallback: draw a simple coloured rect
            ctx.fillStyle = i < player.health ? '#E03030' : '#555';
            ctx.fillRect(hx, hy, heartSize, heartSize);
        }
    }

    // === DWARF INTERACTION PANEL ===
    if (dwarfInteracting) {
        const panH = 130;
        const panY = canvas.height - panH;
        const panW = canvas.width;
        const pad = 12;
        const portraitSize = 48;

        // Dark semi-transparent background
        ctx.fillStyle = 'rgba(10, 5, 20, 0.92)';
        ctx.fillRect(0, panY, panW, panH);
        // Gold border top
        ctx.fillStyle = '#7a5c00';
        ctx.fillRect(0, panY, panW, 2);

        // Dwarf portrait (idle frame)
        const pFrame = Math.floor(Date.now() / 150) % 4;
        const pSprite = images[`dwarf_idle_${pFrame}`];
        if (pSprite) {
            ctx.save();
            // Flip to face right (into the panel)
            ctx.translate(pad + portraitSize / 2, panY + pad + portraitSize / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(pSprite, -portraitSize / 2, -portraitSize / 2, portraitSize, portraitSize);
            ctx.restore();
        }
        // Portrait border
        ctx.strokeStyle = '#7a5c00';
        ctx.lineWidth = 2;
        ctx.strokeRect(pad, panY + pad, portraitSize, portraitSize);

        // Speaker name
        ctx.font = 'bold 16px Pixelify Sans';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'left';
        ctx.fillText('Tavern Keeper', pad + portraitSize + 10, panY + 22);

        // Dialog line (typewriter)
        const isOnOptions = dwarfInteractPage >= DWARF_INTERACT_LINES.length - 1 &&
            dwarfInteractChars >= (DWARF_INTERACT_LINES[dwarfInteractPage] || '').length;
        const currentLine = DWARF_INTERACT_LINES[dwarfInteractPage] || '';
        const visibleLine = currentLine.substring(0, dwarfInteractChars);
        const textX = pad + portraitSize + 10;
        const textW = panW - textX - pad;

        ctx.font = '16px Pixelify Sans';
        ctx.fillStyle = '#f0e8d0';
        ctx.textAlign = 'left';
        // Render line breaks from \n
        visibleLine.split('\n').forEach((row, ri) => {
            ctx.fillText(row, textX, panY + 44 + ri * 20);
        });

        // Options (shown only on last page, once text is fully revealed)
        if (isOnOptions && !dwarfStoryMode) {
            const optY = panY + panH - 38;
            const opts = [
                { label: 'Rest (+1 ♥)', disabled: dwarfHasRested },
                { label: 'His Story', disabled: false },
                { label: 'Leave', disabled: false }
            ];
            opts.forEach((opt, oi) => {
                const isSelected = dwarfInteractOption === oi;
                ctx.font = isSelected ? 'bold 16px Pixelify Sans' : '16px Pixelify Sans';
                ctx.fillStyle = opt.disabled ? '#444' : (isSelected ? '#FFD700' : '#888');
                ctx.textAlign = 'left';
                const lx = textX + oi * 105;
                ctx.fillText(isSelected ? '▶ ' + opt.label : (opt.disabled ? '✗ ' : '  ') + opt.label, lx, optY);
            });

            ctx.font = '16px Pixelify Sans';
            ctx.fillStyle = '#555';
            ctx.textAlign = 'right';
            ctx.fillText('[←/→] Select  [F/Enter] Confirm  [Esc] Close', panW - pad, panY + panH - 6);

        } else if (dwarfStoryMode) {
            // Story sub-mode: replace text area with story page
            const storyLine = DWARF_STORY_LINES[dwarfStoryPage] || '';
            const storyVisible = storyLine.substring(0, dwarfStoryChars);
            // Clear text area first
            ctx.fillStyle = 'rgba(10, 5, 20, 0.92)';
            ctx.fillRect(textX - 2, panY + 28, panW - textX - pad + 2, panH - 42);

            ctx.font = '16px Pixelify Sans';
            ctx.fillStyle = '#f0e8d0';
            ctx.textAlign = 'left';
            storyVisible.split('\n').forEach((row, ri) => {
                ctx.fillText(row, textX, panY + 44 + ri * 20);
            });

            // Page indicator
            ctx.font = '16px Pixelify Sans';
            ctx.fillStyle = '#7a5c00';
            ctx.textAlign = 'left';
            ctx.fillText(`(${dwarfStoryPage + 1}/${DWARF_STORY_LINES.length})`, textX, panY + panH - 18);

            const storyDone = dwarfStoryChars >= storyLine.length;
            ctx.font = '16px Pixelify Sans';
            ctx.fillStyle = storyDone ? '#888' : '#333';
            ctx.textAlign = 'right';
            const isLast = dwarfStoryPage >= DWARF_STORY_LINES.length - 1;
            ctx.fillText(storyDone ? (isLast ? '[F] Close' : '[F] Next...') : '[F] Skip', panW - pad, panY + panH - 6);
        } else {
            // Not yet on options — show "press F to continue" hint
            const textFullyShown = dwarfInteractChars >= currentLine.length;
            ctx.font = '16px Pixelify Sans';
            ctx.fillStyle = textFullyShown ? '#888' : '#333';
            ctx.textAlign = 'right';
            ctx.fillText(textFullyShown ? '[F] Continue...' : '[F] Skip', panW - pad, panY + panH - 6);
        }
    }

    // Game over overlay
    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';

        ctx.font = 'bold 40px Pixelify Sans';
        ctx.fillText('GAME OVER', canvas.width / 2, 80);

        ctx.font = '22px Pixelify Sans';
        ctx.fillText('Final Score: ' + score, canvas.width / 2, 120);

        // Draw Leaderboard
        ctx.font = 'bold 20px Pixelify Sans';
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.fillText('--- Top 5 Players ---', canvas.width / 2, 170);

        let startY = 210;
        if (highScores.length === 0) {
            ctx.font = '16px Pixelify Sans';
            ctx.fillStyle = 'white';
            ctx.fillText('No high scores yet!', canvas.width / 2, startY);
        } else {
            let bestScore = highScores[0].score;
            highScores.forEach((entry, index) => {
                let text = `${index + 1}. ${entry.name} - ${entry.score}`;
                if (entry.score === bestScore) {
                    ctx.font = 'bold 18px Pixelify Sans';
                    ctx.fillStyle = '#FFD700';
                } else {
                    ctx.font = '18px Pixelify Sans';
                    ctx.fillStyle = 'white';
                }
                ctx.fillText(text, canvas.width / 2, startY + (index * 30));
            });
        }

        const gameOverButtons = [
            { text: 'Play Again', action: () => { restartGame(); } },
            { text: 'Main Menu', action: () => { gameState = 'START_MENU'; selectedMenuIndex = 0; } }
        ];
        drawTextButtons(gameOverButtons, canvas.height - 100, 48);
    } else if (isPaused) {
        // Pause Menu overlay
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = 'bold 40px Pixelify Sans';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 60);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        const pauseButtons = [
            { text: 'Resume', action: () => { isPaused = false; selectedMenuIndex = 0; } },
            { text: 'Instructions', action: () => { gameState = 'INSTRUCTIONS'; selectedMenuIndex = 0; } },
            { text: 'Main Menu', action: () => { isPaused = false; gameState = 'START_MENU'; selectedMenuIndex = 0; } }
        ];
        drawTextButtons(pauseButtons, canvas.height / 2, 55);
    }
}
