let keys = [];
window.addEventListener('keydown', function(e) {
    keys[e.keyCode] = true;
    if ((e.keyCode === 32 || e.keyCode === 38) && !player.jumping) {
        player.jumping = true;
        player.velY = baseJump - Math.abs(player.velX) * 0.5;
    }
    if ((e.key === 'r' || e.key === 'R') && gameOver) {
        restartGame();
    }
    if (e.key === 'Escape') {
        if (!gameOver) isPaused = !isPaused;
    }
});

window.addEventListener('keyup', function(e) {
    keys[e.keyCode] = false;
});

// Mobile Controls
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[37] = true; });
leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); keys[37] = false; });
leftBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); keys[37] = false; });

rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[39] = true; });
rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); keys[39] = false; });
rightBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); keys[39] = false; });

window.addEventListener('touchstart', (e) => {
    // Ignore button taps
    if (e.target === leftBtn || e.target === rightBtn) return;
    
    // Check restart
    if (gameOver) {
        restartGame();
        return;
    }

    // Check jump
    if (!player.jumping) {
        player.jumping = true;
        player.velY = baseJump - Math.abs(player.velX) * 0.5;
    }
}, { passive: false });
