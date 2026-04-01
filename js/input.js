let keys = [];

function handleMenuClick(clientX, clientY) {
    if (gameState === 'PLAYING' && !isPaused) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    for (let i = 0; i < menuButtons.length; i++) {
        let btn = menuButtons[i];
        if (x >= btn.x && x <= btn.x + btn.width &&
            y >= btn.y && y <= btn.y + btn.height) {
            btn.action();
            break;
        }
    }
}

canvas.addEventListener('mousedown', function(e) {
    handleMenuClick(e.clientX, e.clientY);
});

canvas.addEventListener('mousemove', function(e) {
    if (gameState === 'PLAYING') return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
});

window.addEventListener('keydown', function(e) {
    keys[e.keyCode] = true;

    if (gameState === 'PLAYING') {
        if ((e.keyCode === 32 || e.keyCode === 38) && !player.jumping) {
            player.jumping = true;
            player.velY = baseJump - Math.abs(player.velX) * 0.5;
        }
        if (e.key === 'Escape') {
            isPaused = !isPaused;
        }
    }

    // Menu keyboard navigation (menus + pause screen + game over)
    if ((gameState !== 'PLAYING' && gameState !== 'GAME_OVER') || isPaused || gameState === 'GAME_OVER') {
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            e.preventDefault();
            selectedMenuIndex = (selectedMenuIndex + 1) % Math.max(1, menuButtons.length);
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            selectedMenuIndex = (selectedMenuIndex - 1 + Math.max(1, menuButtons.length)) % Math.max(1, menuButtons.length);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (menuButtons[selectedMenuIndex]) {
                menuButtons[selectedMenuIndex].action();
            }
        }
    }

    if ((e.key === 'r' || e.key === 'R') && gameState === 'GAME_OVER') {
        gameState = 'START_MENU';
        selectedMenuIndex = 0;
    }
});

window.addEventListener('keyup', function(e) {
    keys[e.keyCode] = false;
});

// Mobile Controls
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (gameState === 'PLAYING') keys[37] = true; });
leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); keys[37] = false; });
leftBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); keys[37] = false; });

rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (gameState === 'PLAYING') keys[39] = true; });
rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); keys[39] = false; });
rightBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); keys[39] = false; });

window.addEventListener('touchstart', (e) => {
    if (e.target === leftBtn || e.target === rightBtn) return;
    
    if (gameState !== 'PLAYING') {
        const touch = e.touches[0];
        handleMenuClick(touch.clientX, touch.clientY);
        return;
    }
    
    if (gameState === 'PLAYING' && !player.jumping) {
        player.jumping = true;
        player.velY = baseJump - Math.abs(player.velX) * 0.5;
    }
}, { passive: false });
