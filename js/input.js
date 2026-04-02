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
            if (dwarfInteracting) {
                // Close interaction panel
                dwarfInteracting = false;
            } else {
                isPaused = !isPaused;
            }
        }

        // Story sub-mode: F/Enter advances story pages; Escape exits story back to options
        if (dwarfStoryMode) {
            if (e.key === 'f' || e.key === 'F' || e.key === 'Enter') {
                e.preventDefault();
                const storyLine = DWARF_STORY_LINES[dwarfStoryPage] || '';
                if (dwarfStoryChars < storyLine.length) {
                    dwarfStoryChars = storyLine.length; // skip typewriter
                } else if (dwarfStoryPage < DWARF_STORY_LINES.length - 1) {
                    dwarfStoryPage++;
                    dwarfStoryChars = 0;
                } else {
                    // End of story — return to options
                    dwarfStoryMode = false;
                }
            } else if (e.key === 'Escape') {
                dwarfStoryMode = false;
                e.preventDefault();
            }
            return; // absorb all other keys during story
        }

        // Dwarf interaction — open / advance / confirm
        if (e.key === 'f' || e.key === 'F') {
            if (tavernState >= 1 && tavernFloorY !== null) {
                const dSize = 40;
                const dX = canvas.width - 40 - dSize;
                const dwarfCenterX = dX + dSize / 2;
                const dist = Math.abs((player.x + player.width / 2) - dwarfCenterX);

                if (!dwarfInteracting && dist <= DWARF_INTERACT_RANGE) {
                    dwarfInteracting = true;
                    dwarfInteractPage = 0;
                    dwarfInteractChars = 0;
                    dwarfInteractOption = 0;
                } else if (dwarfInteracting) {
                    const currentLine = DWARF_INTERACT_LINES[dwarfInteractPage] || '';
                    if (dwarfInteractChars < currentLine.length) {
                        dwarfInteractChars = currentLine.length; // skip typewriter
                    } else if (dwarfInteractPage < DWARF_INTERACT_LINES.length - 1) {
                        dwarfInteractPage++;
                        dwarfInteractChars = 0;
                    } else {
                        // Confirm current option
                        _confirmDwarfOption();
                    }
                }
            }
        }

        // Left/Right navigation on options page
        const onOptionsPage = dwarfInteracting &&
            dwarfInteractPage >= DWARF_INTERACT_LINES.length - 1 &&
            dwarfInteractChars >= (DWARF_INTERACT_LINES[dwarfInteractPage] || '').length;

        if (onOptionsPage) {
            const numOpts = 3; // Rest, His Story, Leave
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                dwarfInteractOption = (dwarfInteractOption - 1 + numOpts) % numOpts;
                e.preventDefault();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                dwarfInteractOption = (dwarfInteractOption + 1) % numOpts;
                e.preventDefault();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                _confirmDwarfOption();
            }
        }
    }

    // Helper: confirm whichever option is currently selected
    function _confirmDwarfOption() {
        if (dwarfInteractOption === 0 && !dwarfHasRested) {
            // Rest — restore 1 heart
            player.health = Math.min(player.health + 1, player.maxHealth);
            dwarfHasRested = true;
            dwarfInteracting = false;
        } else if (dwarfInteractOption === 1) {
            // His Story — enter story sub-mode
            dwarfStoryMode = true;
            dwarfStoryPage = 0;
            dwarfStoryChars = 0;
        } else {
            // Leave (or Rest when already rested)
            dwarfInteracting = false;
        }
    }

    // Menu keyboard navigation (menus + pause screen + game over — NOT during dwarf chat)
    if (!dwarfInteracting &&
        ((gameState !== 'PLAYING' && gameState !== 'GAME_OVER') || isPaused || gameState === 'GAME_OVER')) {
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
