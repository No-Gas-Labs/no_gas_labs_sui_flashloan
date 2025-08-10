
class NoGasSlapGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.socket = io();
        
        this.gameState = {
            players: new Map(),
            balls: [],
            myId: null,
            myPlayer: null,
            arena: { width: 800, height: 600 }
        };
        
        this.keys = {
            w: false, a: false, s: false, d: false
        };
        
        this.lastMoveTime = 0;
        this.moveThrottle = 50; // 20fps movement updates
        
        this.init();
    }
    
    init() {
        this.setupSocketEvents();
        this.setupControls();
        this.setupUI();
        this.startGameLoop();
        this.joinGame();
    }
    
    setupSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateConnectionStatus('Connected', 'connected');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus('Disconnected', 'disconnected');
        });
        
        this.socket.on('game-state', (data) => {
            this.gameState.players.clear();
            data.players.forEach(player => {
                this.gameState.players.set(player.id, player);
            });
            this.gameState.myId = data.yourId;
            this.gameState.myPlayer = this.gameState.players.get(data.yourId);
            this.gameState.arena = data.arena;
            
            this.updatePlayersList();
            this.updateStats();
        });
        
        this.socket.on('player-joined', (player) => {
            this.gameState.players.set(player.id, player);
            this.updatePlayersList();
        });
        
        this.socket.on('player-left', (playerId) => {
            this.gameState.players.delete(playerId);
            this.updatePlayersList();
        });
        
        this.socket.on('player-moved', (data) => {
            const player = this.gameState.players.get(data.id);
            if (player) {
                player.x = data.x;
                player.y = data.y;
            }
        });
        
        this.socket.on('slap-created', (ball) => {
            this.gameState.balls.push(ball);
            this.createSlapEffect(ball.x, ball.y);
        });
        
        this.socket.on('balls-update', (balls) => {
            this.gameState.balls = balls;
        });
        
        this.socket.on('ball-expired', (ballId) => {
            this.gameState.balls = this.gameState.balls.filter(b => b.id !== ballId);
        });
        
        this.socket.on('player-hit', (data) => {
            const player = this.gameState.players.get(data.playerId);
            if (player) {
                player.health = data.health;
                player.isAlive = data.isAlive;
                
                // Visual hit effect
                this.createHitEffect(player.x, player.y);
                
                if (data.playerId === this.gameState.myId) {
                    this.updateStats();
                    if (!data.isAlive) {
                        this.showRespawnButton();
                    }
                }
            }
        });
        
        this.socket.on('player-respawned', (data) => {
            const player = this.gameState.players.get(data.id);
            if (player) {
                player.x = data.x;
                player.y = data.y;
                player.health = data.health;
                player.isAlive = true;
                
                if (data.id === this.gameState.myId) {
                    this.hideRespawnButton();
                    this.updateStats();
                }
            }
        });
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key in this.keys) {
                this.keys[key] = true;
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key in this.keys) {
                this.keys[key] = false;
                e.preventDefault();
            }
        });
        
        // Mouse controls
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameState.myPlayer || !this.gameState.myPlayer.isAlive) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            
            this.movePlayer(x, y);
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (!this.gameState.myPlayer || !this.gameState.myPlayer.isAlive) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            
            this.slap(x, y);
        });
        
        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            if (e.touches.length === 1) {
                this.movePlayer(x, y);
            }
        });
        
        // Double tap to slap on mobile
        let lastTap = 0;
        this.canvas.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                const touch = e.changedTouches[0];
                const rect = this.canvas.getBoundingClientRect();
                const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
                const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
                this.slap(x, y);
            }
            lastTap = currentTime;
        });
    }
    
    setupUI() {
        // Get userId from URL params (from Telegram)
        const urlParams = new URLSearchParams(window.location.search);
        this.userId = urlParams.get('userId') || 'anonymous';
        
        // Telegram button
        document.getElementById('telegramBtn').addEventListener('click', () => {
            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.close();
            } else {
                alert('Open this game from Telegram bot!');
            }
        });
        
        // Respawn button
        document.getElementById('respawnBtn').addEventListener('click', () => {
            this.joinGame();
        });
    }
    
    joinGame() {
        const username = `Player${this.userId.slice(-4)}`;
        this.socket.emit('join-game', {
            userId: this.userId,
            username: username
        });
        this.hideRespawnButton();
    }
    
    movePlayer(targetX, targetY) {
        if (!this.gameState.myPlayer || !this.gameState.myPlayer.isAlive) return;
        
        const now = Date.now();
        if (now - this.lastMoveTime < this.moveThrottle) return;
        this.lastMoveTime = now;
        
        // Update local position immediately for responsiveness
        this.gameState.myPlayer.x = Math.max(0, Math.min(this.gameState.arena.width - this.gameState.myPlayer.width, targetX - this.gameState.myPlayer.width / 2));
        this.gameState.myPlayer.y = Math.max(0, Math.min(this.gameState.arena.height - this.gameState.myPlayer.height, targetY - this.gameState.myPlayer.height / 2));
        
        // Send to server
        this.socket.emit('player-move', {
            x: this.gameState.myPlayer.x,
            y: this.gameState.myPlayer.y
        });
    }
    
    slap(targetX, targetY) {
        if (!this.gameState.myPlayer || !this.gameState.myPlayer.isAlive) return;
        
        const dx = targetX - (this.gameState.myPlayer.x + this.gameState.myPlayer.width / 2);
        const dy = targetY - (this.gameState.myPlayer.y + this.gameState.myPlayer.height / 2);
        const direction = Math.atan2(dy, dx);
        
        this.socket.emit('player-slap', {
            targetX,
            targetY,
            direction
        });
        
        // Visual feedback
        this.createSlapEffect(this.gameState.myPlayer.x + this.gameState.myPlayer.width / 2, this.gameState.myPlayer.y + this.gameState.myPlayer.height / 2);
    }
    
    handleKeyboardMovement() {
        if (!this.gameState.myPlayer || !this.gameState.myPlayer.isAlive) return;
        
        let dx = 0, dy = 0;
        const speed = 5;
        
        if (this.keys.w) dy -= speed;
        if (this.keys.s) dy += speed;
        if (this.keys.a) dx -= speed;
        if (this.keys.d) dx += speed;
        
        if (dx !== 0 || dy !== 0) {
            const newX = this.gameState.myPlayer.x + dx;
            const newY = this.gameState.myPlayer.y + dy;
            this.movePlayer(newX + this.gameState.myPlayer.width / 2, newY + this.gameState.myPlayer.height / 2);
        }
    }
    
    startGameLoop() {
        const gameLoop = () => {
            this.handleKeyboardMovement();
            this.render();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw players
        for (const [id, player] of this.gameState.players) {
            this.drawPlayer(player, id === this.gameState.myId);
        }
        
        // Draw balls
        this.gameState.balls.forEach(ball => {
            this.drawBall(ball);
        });
        
        // Draw UI elements
        this.drawUI();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawPlayer(player, isMe) {
        if (!player.isAlive) {
            this.ctx.globalAlpha = 0.3;
        }
        
        // Player body
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // Player border
        this.ctx.strokeStyle = isMe ? '#FFD700' : '#fff';
        this.ctx.lineWidth = isMe ? 3 : 1;
        this.ctx.strokeRect(player.x, player.y, player.width, player.height);
        
        // Health bar
        this.drawHealthBar(player);
        
        // Player name
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(player.username, player.x + player.width / 2, player.y - 5);
        
        // Reset alpha
        this.ctx.globalAlpha = 1;
    }
    
    drawHealthBar(player) {
        const barWidth = player.width;
        const barHeight = 6;
        const x = player.x;
        const y = player.y + player.height + 5;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Health
        const healthPercent = player.health / 100;
        this.ctx.fillStyle = healthPercent > 0.6 ? '#4CAF50' : healthPercent > 0.3 ? '#FFA726' : '#F44336';
        this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        // Border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, barWidth, barHeight);
    }
    
    drawBall(ball) {
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.fill();
        this.ctx.strokeStyle = '#FF4444';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Trail effect
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, 12, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
        this.ctx.fill();
    }
    
    drawUI() {
        // Game info
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 80);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🥊 No_Gas_Slaps™', 20, 30);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Players: ${this.gameState.players.size}`, 20, 50);
        
        if (this.gameState.myPlayer) {
            this.ctx.fillText(`Health: ${this.gameState.myPlayer.health}`, 20, 70);
        }
    }
    
    createSlapEffect(x, y) {
        // Visual slap effect (you could add particles here)
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        effect.style.width = '20px';
        effect.style.height = '20px';
        effect.style.background = 'radial-gradient(circle, #FFD700, transparent)';
        effect.style.borderRadius = '50%';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '1000';
        effect.className = 'slap-animation';
        
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 600);
    }
    
    createHitEffect(x, y) {
        // Visual hit effect
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        effect.style.width = '30px';
        effect.style.height = '30px';
        effect.style.background = 'radial-gradient(circle, #FF4444, transparent)';
        effect.style.borderRadius = '50%';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '1000';
        effect.className = 'player-hit';
        
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 500);
    }
    
    updateConnectionStatus(text, className) {
        const statusEl = document.getElementById('connectionStatus');
        statusEl.textContent = text;
        statusEl.className = `status-indicator ${className}`;
    }
    
    updatePlayersList() {
        const listEl = document.getElementById('playersList');
        listEl.innerHTML = '';
        
        for (const [id, player] of this.gameState.players) {
            const playerEl = document.createElement('div');
            playerEl.className = 'player-item';
            
            const healthPercent = (player.health / 100) * 100;
            const statusIcon = player.isAlive ? '🟢' : '💀';
            
            playerEl.innerHTML = `
                <span class="player-name">${statusIcon} ${player.username}</span>
                <div class="health-bar">
                    <div class="health-fill" style="width: ${healthPercent}%"></div>
                </div>
            `;
            
            if (id === this.gameState.myId) {
                playerEl.style.borderLeft = '4px solid #FFD700';
                playerEl.style.background = 'rgba(255, 215, 0, 0.1)';
            }
            
            listEl.appendChild(playerEl);
        }
        
        document.getElementById('playerCount').textContent = `Players: ${this.gameState.players.size}`;
    }
    
    updateStats() {
        if (this.gameState.myPlayer) {
            document.getElementById('playerHealth').textContent = `Health: ${this.gameState.myPlayer.health}`;
        }
    }
    
    showRespawnButton() {
        document.getElementById('respawnBtn').style.display = 'block';
    }
    
    hideRespawnButton() {
        document.getElementById('respawnBtn').style.display = 'none';
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new NoGasSlapGame();
});
