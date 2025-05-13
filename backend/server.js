const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:5173", // Frontend'in bulunduğu adres
    methods: ["GET", "POST"],
  },
});

let playerCount = 0;

io.on("connection", (socket) => {
  playerCount++;

  // İlk oyuncu
  const player = playerCount === 1 ? 1 : 2;
  socket.emit("init", { player, players: getPlayers(), ball: getBall() });

  // Player'ın hareketi
  socket.on("move", (player, direction) => {
    movePaddle(player, direction);
    io.emit("update", { players: getPlayers(), ball: getBall() }); // Tüm oyunculara güncellemeyi gönder
  });

  // Bağlantı kesildiğinde oyuncu sayısını azaltıyoruz
  socket.on("disconnect", () => {
    playerCount--;
  });
});

// Oyuncu verileri
let players = {
  player1: { x: 50, y: 200, score: 0 },
  player2: { x: 580, y: 200, score: 0 },
};

let ball = { x: 320, y: 240, dx: 2, dy: 2 }; // Topun pozisyonu ve hareket yönü

// Topu sürekli hareket ettir
setInterval(() => {
  moveBall();
  io.emit("update", { players: getPlayers(), ball: getBall() }); // Tüm oyunculara güncellenmiş top bilgisini gönder
}, 1000 / 60); // Her saniye 60 FPS hızında hareket

function getPlayers() {
  return players;
}

function getBall() {
  return ball;
}

function movePaddle(player, direction) {
  if (player === 1) {
    if (direction === "up") players.player1.y -= 10;
    if (direction === "down") players.player1.y += 10;
  }
  if (player === 2) {
    if (direction === "up") players.player2.y -= 10;
    if (direction === "down") players.player2.y += 10;
  }
}

function moveBall() {
  // Topun X ve Y pozisyonunu güncelle
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Top duvara çarptığında yön değiştirir
  if (ball.y <= 0 || ball.y >= 480) {
    ball.dy = -ball.dy; // Y ekseninde yön değiştir
  }

  // Paddle'lara çarpma kontrolü
  if (
    ball.x <= players.player1.x + 15 &&
    ball.x >= players.player1.x &&
    ball.y >= players.player1.y &&
    ball.y <= players.player1.y + 60
  ) {
    ball.dx = -ball.dx; // Player 1 paddle'ına çarptığında yön değiştir
  }

  if (
    ball.x >= players.player2.x - 15 &&
    ball.x <= players.player2.x &&
    ball.y >= players.player2.y &&
    ball.y <= players.player2.y + 60
  ) {
    ball.dx = -ball.dx; // Player 2 paddle'ına çarptığında yön değiştir
  }

  // Skor kontrolü - Top biri tarafından dışarı gönderildiğinde
  if (ball.x <= 0) {
    players.player2.score += 1; // Player 2 skoru arttırır
    resetBall();
  } else if (ball.x >= 640) {
    players.player1.score += 1; // Player 1 skoru arttırır
    resetBall();
  }
}

function resetBall() {
  // Topu ortada başlat
  ball.x = 320;
  ball.y = 240;
  ball.dx = 2;
  ball.dy = 2;
}
