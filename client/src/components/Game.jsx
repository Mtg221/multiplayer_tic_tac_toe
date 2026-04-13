import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Board from './Board';
import './Game.css';

function Game() {
  const socketRef = useRef(null);
  const [roomID, setRoomID] = useState('');
  const [joinedRoom, setJoinedRoom] = useState('');
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  useEffect(() => {
    socketRef.current = io(BACKEND_URL);

    socketRef.current.on('player_symbol', (symbol) => {
      console.log('Received player_symbol:', symbol);
      setPlayerSymbol(symbol);
    });

    socketRef.current.on('game_state', ({ squares: serverSquares, xIsNext: serverXIsNext }) => {
      console.log('Received game_state:', { serverSquares, serverXIsNext });
      setSquares(serverSquares);
      setXIsNext(serverXIsNext);
    });

    socketRef.current.on('move_made', ({ index, symbol, xIsNext: newXIsNext }) => {
      console.log('Received move_made:', { index, symbol, xIsNext: newXIsNext });
      setSquares((prevSquares) => {
        const newSquares = [...prevSquares];
        newSquares[index] = symbol;
        return newSquares;
      });
      setXIsNext(newXIsNext);
    });

    socketRef.current.on('move_confirmed', ({ xIsNext: newXIsNext }) => {
      console.log('Received move_confirmed:', { xIsNext: newXIsNext });
      setXIsNext(newXIsNext);
    });

    socketRef.current.on('room_update', ({ players: roomPlayers, currentPlayer: roomCurrentPlayer, playerLeft }) => {
      console.log('Received room_update:', { roomPlayers, roomCurrentPlayer, playerLeft });
      setPlayers(roomPlayers);
      setCurrentPlayer(roomCurrentPlayer);
    });

    socketRef.current.on('game_reset', ({ squares: resetSquares, xIsNext: resetXIsNext }) => {
      console.log('Received game_reset:', { resetSquares, resetXIsNext });
      setSquares(resetSquares);
      setXIsNext(resetXIsNext);
      setWinner(null);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const winnerInfo = calculateWinner(squares);
    if (winnerInfo) {
      setWinner(winnerInfo.winner);
    }
  }, [squares]);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const handleJoinRoom = () => {
    if (roomID.trim() && socketRef.current) {
      console.log('Joining room:', roomID);
      socketRef.current.emit('join_room', roomID);
      setJoinedRoom(roomID);
    }
  };

  const handleClick = (index) => {
    console.log('Square clicked:', index);
    console.log('Current state:', { squares, xIsNext, playerSymbol, winner, joinedRoom });
    
    if (squares[index]) {
      console.log('Square already filled');
      return;
    }
    if (winner) {
      console.log('Game already has a winner');
      return;
    }
    if (!playerSymbol) {
      console.log('No player symbol assigned yet');
      return;
    }

    const isMyTurn = (xIsNext && playerSymbol === 'X') || (!xIsNext && playerSymbol === 'O');
    console.log('Is my turn?', isMyTurn, 'xIsNext:', xIsNext, 'playerSymbol:', playerSymbol);
    
    if (!isMyTurn) {
      console.log('Not your turn!');
      return;
    }

    if (socketRef.current && joinedRoom) {
      const symbol = xIsNext ? 'X' : 'O';
      console.log('Emitting make_move:', { roomID: joinedRoom, index, symbol });
      socketRef.current.emit('make_move', { roomID: joinedRoom, index, symbol });
    } else {
      console.log('No socket or room:', { socket: !!socketRef.current, room: joinedRoom });
    }
  };

  const handleReset = () => {
    if (socketRef.current && joinedRoom) {
      socketRef.current.emit('reset_game', joinedRoom);
      setWinner(null);
    }
  };

  const isMyTurn = (xIsNext && playerSymbol === 'X') || (!xIsNext && playerSymbol === 'O');
  const isDraw = !winner && squares.every((square) => square !== null);
  const waitingForPlayer = players.length < 2;

  if (!joinedRoom) {
    return (
      <div className="game">
        <h1>Tic-Tac-Toe Multiplayer</h1>
        <div className="room-input">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomID}
            onChange={(e) => setRoomID(e.target.value)}
          />
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game">
      <h1>Tic-Tac-Toe Multiplayer</h1>
      <div className="game-info">
        <p>Room: {joinedRoom}</p>
        <p>Your symbol: {playerSymbol || 'Loading...'}</p>
        <p>Players in room: {players.length}/2</p>
        <p>Current turn: {currentPlayer}</p>
        {waitingForPlayer && <p className="waiting">Waiting for another player...</p>}
      </div>
      <div className="game-status">
        {winner ? (
          <p>Winner: {winner}!</p>
        ) : isDraw ? (
          <p>Draw!</p>
        ) : waitingForPlayer ? (
          <p>Waiting for opponent...</p>
        ) : !isMyTurn ? (
          <p>Waiting for opponent's turn...</p>
        ) : (
          <p>Your turn! ({playerSymbol})</p>
        )}
      </div>
      <Board 
        squares={squares} 
        onClick={handleClick} 
        disabled={waitingForPlayer || !isMyTurn || !!winner || !playerSymbol} 
      />
      <button className="reset-button" onClick={handleReset}>
        Reset Game
      </button>
    </div>
  );
}

export default Game;
