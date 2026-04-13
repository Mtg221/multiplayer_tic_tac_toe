# Real-Time Multiplayer Tic-Tac-Toe

A multiplayer Tic-Tac-Toe game built with React and Socket.io that supports two players over a network using Socket.io rooms.

## Features

- **Socket.io Rooms**: Players can create/join private rooms by entering a Room ID
- **Real-time Sync**: Game state is synchronized between players in real-time
- **Turn Management**: Players can only make moves on their turn (X goes first)
- **Player Assignment**: First player to join is 'X', second is 'O'
- **Win Detection**: Automatically detects when a player wins or the game is a draw
- **Reset Functionality**: Either player can reset the game

## Project Structure

```
multi/
├── server/
│   ├── index.js          # Socket.io server
│   └── package.json
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── Game.jsx      # Main game component with socket logic
    │   │   ├── Board.jsx     # Tic-tac-toe board
    │   │   ├── Square.jsx    # Individual square component
    │   │   └── Game.css      # Game styles
    │   ├── App.jsx
    │   └── App.css
    └── package.json
```

## Setup & Installation

### Prerequisites

- Node.js (v14 or higher recommended)
- npm

### Installation Steps

1. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Install client dependencies:**
   ```bash
   cd ../client
   npm install
   ```

## Running the Application

### Start the Server

```bash
cd server
npm start
```

The server will run on `http://localhost:4000`

### Start the Client

Open a new terminal and run:

```bash
cd client
npm run dev
```

The client will run on `http://localhost:5173`

## How to Play

1. Open `http://localhost:5173` in two different browser windows/tabs
2. In the first window:
   - Enter a Room ID (e.g., "room1")
   - Click "Join Room"
   - You'll be assigned as player 'X'
3. In the second window:
   - Enter the same Room ID ("room1")
   - Click "Join Room"
   - You'll be assigned as player 'O'
4. Player 'X' goes first
5. Click on a square to make your move
6. The game state syncs automatically between both players
7. First to get 3 in a row wins!
8. Click "Reset Game" to play again

## Socket.io Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `roomID` (string) | Join a specific room |
| `make_move` | `{ roomID, index, symbol }` | Make a move on the board |
| `reset_game` | `roomID` (string) | Reset the game board |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `player_symbol` | `symbol` ('X' or 'O') | Assign player symbol |
| `game_state` | `{ squares, xIsNext }` | Initial game state |
| `move_made` | `{ index, symbol, xIsNext }` | Opponent made a move |
| `move_confirmed` | `{ xIsNext }` | Move confirmation |
| `room_update` | `{ players, currentPlayer }` | Room status update |
| `game_reset` | `{ squares, xIsNext }` | Game was reset |

## Key Implementation Details

### useRef for Socket Connection

The socket connection is stored in a `useRef` to prevent re-initialization on re-renders:

```javascript
const socketRef = useRef(null);

useEffect(() => {
  socketRef.current = io('http://localhost:4000');
  
  return () => {
    socketRef.current.disconnect();
  };
}, []);
```

### Turn Management

Players can only make moves when it's their turn:

```javascript
const isMyTurn = (xIsNext && playerSymbol === 'X') || (!xIsNext && playerSymbol === 'O');
```

### Server Room Management

The server tracks players in each room and assigns symbols based on join order:

```javascript
const playerSymbol = room.players.length === 0 ? 'X' : 'O';
room.players.push(socket.id);
```
