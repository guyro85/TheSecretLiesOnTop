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

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background tiles
    const tileSize = 32;
    // We want the background to scroll down as the player goes up.
    // cameraY increases as we go up.
    // The tiles move down by (cameraY % tileSize)
    const offsetY = Math.floor(cameraY) % tileSize;
    
    // Fill background with wall tiles
    for (let y = -tileSize + offsetY; y < canvas.height; y += tileSize) {
        // Draw left wall
        if (images['wall_left']) ctx.drawImage(images['wall_left'], 0, y, tileSize, tileSize);
        
        // Draw middle walls
        if (images['wall_mid']) {
            const logicalRow = Math.floor((Math.floor(cameraY) - y) / tileSize);
            for (let x = tileSize; x < canvas.width - tileSize; x += tileSize) {
                const logicalCol = Math.floor(x / tileSize);
                // Pseudo-random value between 0 and 1 based on row and col coordinates
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
    }

    // Draw platforms
    platforms.forEach(platform => {
        // Skip rendering invisible hitboxes for the tavern
        if (platform.isLadder || platform.isTavern) return;

        // Colour: falling=Tomato, moving=Steel Blue, normal=Tan
        ctx.fillStyle = platform.falling ? '#FF6347' : platform.moving ? '#4682B4' : '#D2B48C';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Warning bar
        if (!platform.falling && platform.standTimer > 0) {
            const pct = platform.standTimer / 4000;
            ctx.fillStyle = pct < 0.5 ? '#FFA500' : '#FF4500';
            ctx.fillRect(platform.x, platform.y - 4, platform.width * pct, 3);
        }

        // Floor label on multiples of 10
        if (platform.number % 10 === 0) {
            ctx.save();
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'black';
            ctx.fillStyle = 'white';
            const label = 'FLOOR ' + platform.number;
            const cx = platform.x + platform.width / 2;
            ctx.strokeText(label, cx, platform.y + 8);
            ctx.fillText(label, cx, platform.y + 8);
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
                ctx.drawImage(images[spriteName], -drawSizes/2, drawPy - (ey + e.height / 2), drawSizes, drawSizes);
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
    const pSpriteName = isRunning ? `knight_run_${pTimer}` : `knight_idle_${pTimer}`;
    
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
        ctx.arc(player.x + player.width/2, player.y + player.height/2, 24, 0, Math.PI*2);
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

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(5, 5, 165, starTimer > 0 ? 75 : 55);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 12, 26);
    ctx.font = '13px Arial';
    ctx.fillStyle = speedMult > 1.5 ? '#FFD700' : '#aaa';
    ctx.fillText('Speed \xd7' + speedMult.toFixed(1), 12, 48);
    if (starTimer > 0) {
        drawStarShape(22, 64, 8, '#FFD700');
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(Math.ceil(starTimer / 60) + 's', 36, 69);
    }

    // Game over overlay
    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        
        ctx.font = 'bold 40px Arial';
        ctx.fillText('GAME OVER', canvas.width / 2, 80);
        
        ctx.font = '22px Arial';
        ctx.fillText('Final Score: ' + score, canvas.width / 2, 120);
        
        // Draw Leaderboard
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.fillText('--- Top 5 Players ---', canvas.width / 2, 170);
        
        let startY = 210;
        if (highScores.length === 0) {
            ctx.font = '16px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText('No high scores yet!', canvas.width / 2, startY);
        } else {
            let bestScore = highScores[0].score;
            highScores.forEach((entry, index) => {
                let text = `${index + 1}. ${entry.name} - ${entry.score}`;
                if (entry.score === bestScore) {
                    ctx.font = 'bold 18px Arial';
                    ctx.fillStyle = '#FFD700';
                } else {
                    ctx.font = '18px Arial';
                    ctx.fillStyle = 'white';
                }
                ctx.fillText(text, canvas.width / 2, startY + (index * 30));
            });
        }

        ctx.font = '15px Arial';
        ctx.fillStyle = '#ccc';
        ctx.fillText('Press R to restart', canvas.width / 2, canvas.height - 40);
    } else if (isPaused) {
        // Pause Menu overlay
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '20px Arial';
        ctx.fillText('Press ESC to Resume', canvas.width / 2, canvas.height / 2 + 30);
    }
}
