const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://multiplayer-tic-tac-toe-delta.vercel.app',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : []),
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS non autorisé'));
  },
}));

app.get('/', (req, res) => res.json({ message: 'Tic-Tac-Toe server running' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
});

const rooms = {};
const playerRooms = {};

// Validation serveur : vérifie si le coup est légal
function isValidMove(room, index, symbol) {
  const playerIndex = room.players.indexOf(symbol === 'X' ? room.players[0] : room.players[1]);
  const isPlayerTurn = (symbol === 'X') === room.xIsNext;
  return (
    room.squares[index] === null &&
    isPlayerTurn &&
    index >= 0 && index < 9
  );
}

// Détection de victoire côté serveur
function checkWinner(squares) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (const [a,b,c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c])
      return squares[a];
  }
  return null;
}

io.on('connection', (socket) => {
  socket.on('join_room', (roomID) => {
    if (!roomID || typeof roomID !== 'string' || roomID.length > 50) return;

    socket.join(roomID);

    if (!rooms[roomID]) {
      rooms[roomID] = { players: [], squares: Array(9).fill(null), xIsNext: true };
    }

    const room = rooms[roomID];

    // Maximum 2 joueurs par room
    if (room.players.length >= 2 && !room.players.includes(socket.id)) {
      socket.emit('room_full');
      return;
    }

    let playerSymbol;
    const existingIndex = room.players.indexOf(socket.id);
    if (existingIndex !== -1) {
      playerSymbol = existingIndex === 0 ? 'X' : 'O';
    } else {
      playerSymbol = room.players.length === 0 ? 'X' : 'O';
      room.players.push(socket.id);
    }

    playerRooms[socket.id] = roomID;

    socket.emit('player_symbol', playerSymbol);
    socket.emit('game_state', { squares: room.squares, xIsNext: room.xIsNext });
    io.to(roomID).emit('room_update', { players: room.players.length, currentPlayer: room.xIsNext ? 'X' : 'O' });
  });

  socket.on('make_move', ({ roomID, index, symbol }) => {
    if (!roomID || typeof index !== 'number' || !['X','O'].includes(symbol)) return;

    const room = rooms[roomID];
    if (!room) return;

    // Vérifier que le socket est bien le joueur attendu
    const playerIndex = room.players.indexOf(socket.id);
    if (playerIndex === -1) return;
    const expectedSymbol = playerIndex === 0 ? 'X' : 'O';
    if (symbol !== expectedSymbol) return;

    if (!isValidMove(room, index, symbol)) return;

    room.squares[index] = symbol;
    room.xIsNext = !room.xIsNext;

    const winner = checkWinner(room.squares);
    const isDraw = !winner && room.squares.every(s => s !== null);

    io.to(roomID).emit('move_made', {
      index, symbol, xIsNext: room.xIsNext,
      winner: winner || null,
      isDraw,
    });

    io.to(roomID).emit('room_update', {
      players: room.players.length,
      currentPlayer: room.xIsNext ? 'X' : 'O',
    });
  });

  socket.on('reset_game', (roomID) => {
    const room = rooms[roomID];
    if (!room) return;

    // Seul un joueur de la room peut reset
    if (!room.players.includes(socket.id)) return;

    room.squares = Array(9).fill(null);
    room.xIsNext = true;

    io.to(roomID).emit('game_reset', { squares: room.squares, xIsNext: true });
    io.to(roomID).emit('room_update', { players: room.players.length, currentPlayer: 'X' });
  });

  socket.on('disconnect', () => {
    const roomID = playerRooms[socket.id];
    if (roomID && rooms[roomID]) {
      const room = rooms[roomID];
      const idx  = room.players.indexOf(socket.id);
      if (idx !== -1) room.players.splice(idx, 1);

      if (room.players.length === 0) {
        delete rooms[roomID];
      } else {
        io.to(roomID).emit('room_update', {
          players: room.players.length,
          currentPlayer: room.xIsNext ? 'X' : 'O',
          playerLeft: true,
        });
      }
    }
    delete playerRooms[socket.id];
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
