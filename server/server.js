
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import TelegramBot from 'node-telegram-bot-api';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Telegram Bot Setup
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Game State
const gameState = {
  players: new Map(),
  arena: {
    width: 800,
    height: 600,
    objects: {
      balls: [],
      lightBlocks: [],
      heavyBlocks: []
    }
  },
  scores: new Map()
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Telegram Bot Commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const gameUrl = `${process.env.GAME_URL || 'https://your-repl-url.replit.dev'}/game?userId=${chatId}`;
  
  bot.sendMessage(chatId, 
    `🎮 Welcome to No_Gas_Slaps™!\n\n` +
    `🥊 Multiplayer slap battle arena\n` +
    `💰 Earn tokens by winning fights\n` +
    `⚡ Gasless blockchain rewards\n\n` +
    `Click to play: ${gameUrl}`, {
    reply_markup: {
      inline_keyboard: [[
        { text: '🎮 Play Now', url: gameUrl }
      ]]
    }
  });
});

bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;
  const playerScore = gameState.scores.get(chatId.toString()) || { wins: 0, slaps: 0, tokens: 0 };
  
  bot.sendMessage(chatId,
    `📊 Your Stats:\n` +
    `🏆 Wins: ${playerScore.wins}\n` +
    `👋 Total Slaps: ${playerScore.slaps}\n` +
    `🪙 Tokens Earned: ${playerScore.tokens}`
  );
});

bot.onText(/\/leaderboard/, (msg) => {
  const chatId = msg.chat.id;
  const topPlayers = Array.from(gameState.scores.entries())
    .sort(([,a], [,b]) => b.wins - a.wins)
    .slice(0, 10);
  
  let leaderboard = '🏆 Top Players:\n\n';
  topPlayers.forEach(([userId, score], index) => {
    leaderboard += `${index + 1}. User ${userId.slice(-4)} - ${score.wins} wins\n`;
  });
  
  bot.sendMessage(chatId, leaderboard || '🏆 No players yet! Be the first!');
});

// Game Socket Events
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  socket.on('join-game', (data) => {
    const { userId, username } = data;
    
    // Initialize player
    const player = {
      id: socket.id,
      userId: userId,
      username: username || `Player${socket.id.slice(-4)}`,
      x: Math.random() * (gameState.arena.width - 50),
      y: Math.random() * (gameState.arena.height - 50),
      width: 40,
      height: 40,
      health: 100,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      isAlive: true,
      lastSlap: 0
    };
    
    gameState.players.set(socket.id, player);
    
    // Initialize score if new player
    if (!gameState.scores.has(userId)) {
      gameState.scores.set(userId, { wins: 0, slaps: 0, tokens: 0 });
    }
    
    // Send game state to new player
    socket.emit('game-state', {
      players: Array.from(gameState.players.values()),
      arena: gameState.arena,
      yourId: socket.id
    });
    
    // Broadcast new player to others
    socket.broadcast.emit('player-joined', player);
    
    console.log(`${player.username} joined the arena`);
  });
  
  socket.on('player-move', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player || !player.isAlive) return;
    
    // Update player position with bounds checking
    player.x = Math.max(0, Math.min(gameState.arena.width - player.width, data.x));
    player.y = Math.max(0, Math.min(gameState.arena.height - player.height, data.y));
    
    // Broadcast position update
    socket.broadcast.emit('player-moved', {
      id: socket.id,
      x: player.x,
      y: player.y
    });
  });
  
  socket.on('player-slap', (data) => {
    const attacker = gameState.players.get(socket.id);
    if (!attacker || !attacker.isAlive) return;
    
    // Cooldown check (1 second between slaps)
    const now = Date.now();
    if (now - attacker.lastSlap < 1000) return;
    attacker.lastSlap = now;
    
    const { targetX, targetY, direction } = data;
    
    // Create slap ball
    const ball = {
      id: `ball_${socket.id}_${now}`,
      x: attacker.x + attacker.width / 2,
      y: attacker.y + attacker.height / 2,
      targetX,
      targetY,
      speed: 8,
      damage: 25,
      ownerId: socket.id,
      direction
    };
    
    gameState.arena.objects.balls.push(ball);
    
    // Broadcast slap
    io.emit('slap-created', ball);
    
    // Update slap count
    const playerScore = gameState.scores.get(attacker.userId);
    if (playerScore) {
      playerScore.slaps++;
    }
    
    console.log(`${attacker.username} slapped towards (${targetX}, ${targetY})`);
  });
  
  socket.on('disconnect', () => {
    const player = gameState.players.get(socket.id);
    if (player) {
      console.log(`${player.username} left the arena`);
      gameState.players.delete(socket.id);
      socket.broadcast.emit('player-left', socket.id);
    }
  });
});

// Game Loop - Handle ball physics and collisions
setInterval(() => {
  const balls = gameState.arena.objects.balls;
  
  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];
    
    // Move ball towards target
    const dx = ball.targetX - ball.x;
    const dy = ball.targetY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > ball.speed) {
      ball.x += (dx / distance) * ball.speed;
      ball.y += (dy / distance) * ball.speed;
      
      // Check collisions with players
      for (const [playerId, player] of gameState.players) {
        if (playerId === ball.ownerId || !player.isAlive) continue;
        
        // Simple collision detection
        if (ball.x >= player.x && ball.x <= player.x + player.width &&
            ball.y >= player.y && ball.y <= player.y + player.height) {
          
          // Hit! Reduce health
          player.health -= ball.damage;
          
          // Remove ball
          balls.splice(i, 1);
          
          // Check if player is defeated
          if (player.health <= 0) {
            player.isAlive = false;
            player.health = 0;
            
            // Award win to attacker
            const attacker = gameState.players.get(ball.ownerId);
            if (attacker) {
              const attackerScore = gameState.scores.get(attacker.userId);
              if (attackerScore) {
                attackerScore.wins++;
                attackerScore.tokens += 10; // Earn 10 tokens per win
              }
              
              // Notify Telegram
              if (attacker.userId) {
                bot.sendMessage(attacker.userId, 
                  `🎉 Victory! You defeated ${player.username}!\n` +
                  `🪙 +10 tokens earned`
                );
              }
            }
            
            if (player.userId) {
              bot.sendMessage(player.userId, 
                `💀 You were defeated by ${attacker?.username || 'Unknown'}!\n` +
                `🔄 Respawning in arena...`
              );
            }
            
            // Respawn player after 3 seconds
            setTimeout(() => {
              player.health = 100;
              player.isAlive = true;
              player.x = Math.random() * (gameState.arena.width - 50);
              player.y = Math.random() * (gameState.arena.height - 50);
              
              io.emit('player-respawned', {
                id: playerId,
                x: player.x,
                y: player.y,
                health: player.health
              });
            }, 3000);
          }
          
          // Broadcast hit
          io.emit('player-hit', {
            playerId,
            health: player.health,
            isAlive: player.isAlive,
            ballId: ball.id
          });
          
          break;
        }
      }
    } else {
      // Ball reached target, remove it
      balls.splice(i, 1);
      io.emit('ball-expired', ball.id);
    }
  }
  
  // Broadcast updated ball positions
  if (balls.length > 0) {
    io.emit('balls-update', balls);
  }
}, 50); // 20 FPS game loop

// Routes
app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/api/game-state', (req, res) => {
  res.json({
    playersCount: gameState.players.size,
    arena: gameState.arena
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 No_Gas_Slaps™ Server running on port ${PORT}`);
  console.log(`🤖 Telegram bot initialized`);
  console.log(`🌐 Game URL: http://0.0.0.0:${PORT}/game`);
});
