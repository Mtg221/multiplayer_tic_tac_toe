const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL ||'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const rooms = {};
const playerRooms = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', (roomID) => {
    console.log(`User ${socket.id} attempting to join room: ${roomID}`);
    
    socket.join(roomID);

    if (!rooms[roomID]) {
      rooms[roomID] = {
        players: [],
        squares: Array(9).fill(null),
        xIsNext: true,
      };
      console.log(`Created new room: ${roomID}`);
    }

    const room = rooms[roomID];
    
    let playerSymbol;
    const existingPlayerIndex = room.players.indexOf(socket.id);
    
    if (existingPlayerIndex !== -1) {
      playerSymbol = existingPlayerIndex === 0 ? 'X' : 'O';
      console.log(`Player ${socket.id} reconnected to room ${roomID} as ${playerSymbol}`);
    } else {
      playerSymbol = room.players.length === 0 ? 'X' : 'O';
      room.players.push(socket.id);
      console.log(`Player ${socket.id} joined room ${roomID} as ${playerSymbol}`);
    }

    playerRooms[socket.id] = roomID;

    socket.emit('player_symbol', playerSymbol);
    socket.emit('game_state', {
      squares: room.squares,
      xIsNext: room.xIsNext,
      currentPlayer: playerSymbol,
    });

    io.to(roomID).emit('room_update', {
      players: room.players,
      currentPlayer: room.xIsNext ? 'X' : 'O',
    });

    console.log(`Room ${roomID} now has players:`, room.players);
  });

  socket.on('make_move', ({ roomID, index, symbol }) => {
    console.log(`make_move received:`, { roomID, index, symbol, socketId: socket.id });
    
    const room = rooms[roomID];
    if (!room) {
      console.log(`Room ${roomID} not found`);
      return;
    }
    
    if (!room.squares[index]) {
      console.log(`Square ${index} is empty, updating`);
      room.squares[index] = symbol;
      room.xIsNext = !room.xIsNext;

      io.to(roomID).emit('move_made', {
        index,
        symbol,
        xIsNext: room.xIsNext,
        currentPlayer: room.xIsNext ? 'X' : 'O',
      });

      io.to(roomID).emit('room_update', {
        players: room.players,
        currentPlayer: room.xIsNext ? 'X' : 'O',
      });

      console.log(`Move made in room ${roomID}: square ${index} = ${symbol}`);
    } else {
      console.log(`Square ${index} is already filled`);
    }
  });

  socket.on('reset_game', (roomID) => {
    const room = rooms[roomID];
    if (room) {
      room.squares = Array(9).fill(null);
      room.xIsNext = true;

      io.to(roomID).emit('game_reset', {
        squares: room.squares,
        xIsNext: true,
      });

      io.to(roomID).emit('room_update', {
        players: room.players,
        currentPlayer: 'X',
      });

      console.log(`Game reset in room ${roomID}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const roomID = playerRooms[socket.id];
    if (roomID && rooms[roomID]) {
      const room = rooms[roomID];
      const playerIndex = room.players.indexOf(socket.id);
      
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        io.to(roomID).emit('room_update', {
          players: room.players,
          currentPlayer: room.xIsNext ? 'X' : 'O',
          playerLeft: socket.id,
        });

        if (room.players.length === 0) {
          delete rooms[roomID];
          console.log(`Room ${roomID} deleted (no players)`);
        } else {
          console.log(`Player left room ${roomID}, remaining players:`, room.players);
        }
      }
    }
    
    delete playerRooms[socket.id];
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
