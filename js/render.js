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

    // Draw platforms
    platforms.forEach(platform => {
        // Colour: falling=red, moving=steel-blue, normal=black
        ctx.fillStyle = platform.falling ? '#FF4500' : platform.moving ? '#2255AA' : 'black';
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
    const enemyColors = { 1: '#8B0000', 2: '#CC4400', 3: '#6600CC' };
    platforms.forEach(platform => {
        const e = platform.enemy;
        if (!e) return;
        const ex = platform.x + e.offsetX;
        const ey = platform.y - e.height;
        ctx.fillStyle = enemyColors[e.type];
        ctx.fillRect(ex, ey, e.width, e.height);
        // Eyes
        ctx.fillStyle = 'white';
        ctx.fillRect(ex + 4, ey + 4, 4, 4);
        ctx.fillRect(ex + 12, ey + 4, 4, 4);
        ctx.fillStyle = 'black';
        ctx.fillRect(ex + 5, ey + 5, 2, 2);
        ctx.fillRect(ex + 13, ey + 5, 2, 2);
        // Type 3: gun barrel
        if (e.type === 3) {
            ctx.fillStyle = '#333';
            ctx.fillRect(ex + 7, ey + 14, 6, 6);
        }
    });

    // Draw bullets
    ctx.fillStyle = '#FF2200';
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw player: flashes gold while star power is active
    ctx.fillStyle = (starTimer > 0 && Math.floor(starTimer / 6) % 2 === 0) ? '#FFD700' : 'red';
    ctx.fillRect(player.x, player.y, player.width, player.height);

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
    }
}
