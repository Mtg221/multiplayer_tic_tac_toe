import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import Board from './Board';
import './Game.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://multiplayer-tic-tac-toe-zjfg.onrender.com';

const WINNING_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function calcWinner(squares) {
  for (const [a,b,c] of WINNING_LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c])
      return { winner: squares[a], line: [a,b,c] };
  }
  return null;
}

function generateRoomId() {
  return Math.random().toString(36).slice(2,8).toUpperCase();
}

function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

export default function Game() {
  const socketRef = useRef(null);
  const [roomInput, setRoomInput]   = useState('');
  const [joinedRoom, setJoinedRoom] = useState('');
  const [squares, setSquares]       = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext]       = useState(true);
  const [playerSymbol, setSymbol]   = useState(null);
  const [playerCount, setCount]     = useState(0);
  const [winInfo, setWinInfo]       = useState(null);
  const [isDraw, setDraw]           = useState(false);
  const [scores, setScores]         = useState({ X: 0, O: 0, draw: 0 });
  const [toasts, setToasts]         = useState([]);
  const [connected, setConnected]   = useState(false);
  const [opponentLeft, setOpLeft]   = useState(false);

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room_full', () => addToast('Room complète (max 2 joueurs)', 'error'));

    socket.on('player_symbol', symbol => {
      setSymbol(symbol);
      addToast(`Tu joues les ${symbol}`, 'info');
    });

    socket.on('game_state', ({ squares: sq, xIsNext: x }) => {
      setSquares(sq); setXIsNext(x);
    });

    socket.on('move_made', ({ index, symbol, xIsNext: x, winner, isDraw: draw }) => {
      setSquares(prev => { const n = [...prev]; n[index] = symbol; return n; });
      setXIsNext(x);
      if (winner) {
        const result = calcWinner([...Array(9).fill(null)].map((_, i) => {
          // recalc from current + new move handled by useEffect
        }));
      }
      if (draw) { setDraw(true); setScores(s => ({ ...s, draw: s.draw + 1 })); }
    });

    socket.on('room_update', ({ players, playerLeft }) => {
      setCount(players);
      if (playerLeft) { setOpLeft(true); addToast("L'adversaire a quitté la partie", 'error'); }
      else { setOpLeft(false); }
    });

    socket.on('game_reset', ({ squares: sq, xIsNext: x }) => {
      setSquares(sq); setXIsNext(x); setWinInfo(null); setDraw(false); setOpLeft(false);
    });

    return () => socket.disconnect();
  }, []);

  // Détection victoire côté client (pour affichage)
  useEffect(() => {
    const result = calcWinner(squares);
    if (result && !winInfo) {
      setWinInfo(result);
      setScores(s => ({ ...s, [result.winner]: s[result.winner] + 1 }));
      const isMe = result.winner === playerSymbol;
      addToast(isMe ? '🎉 Tu as gagné !' : '😔 Tu as perdu...', isMe ? 'success' : 'error');
    }
  }, [squares]);

  const handleJoin = () => {
    const id = roomInput.trim().toUpperCase();
    if (!id || !socketRef.current) return;
    socketRef.current.emit('join_room', id);
    setJoinedRoom(id);
  };

  const handleClick = i => {
    if (squares[i] || winInfo || isDraw || !playerSymbol || playerCount < 2) return;
    const myTurn = (xIsNext && playerSymbol === 'X') || (!xIsNext && playerSymbol === 'O');
    if (!myTurn) { addToast("Ce n'est pas ton tour", 'warn'); return; }
    socketRef.current.emit('make_move', { roomID: joinedRoom, index: i, symbol: playerSymbol });
  };

  const handleReset = () => {
    socketRef.current?.emit('reset_game', joinedRoom);
  };

  const copyRoom = () => {
    navigator.clipboard.writeText(joinedRoom);
    addToast('Room ID copié !', 'success');
  };

  const isMyTurn = playerSymbol && playerCount === 2 && !winInfo && !isDraw &&
    ((xIsNext && playerSymbol === 'X') || (!xIsNext && playerSymbol === 'O'));

  // ── Lobby ──────────────────────────────────────────────────
  if (!joinedRoom) {
    return (
      <div className="app">
        <Toast toasts={toasts} />
        <div className="lobby">
          <div className="logo-wrap">
            <span className="logo-x">X</span>
            <span className="logo-o">O</span>
          </div>
          <h1>Tic-Tac-Toe</h1>
          <p className="subtitle">Multijoueur en temps réel</p>

          <div className="lobby-card">
            <div className="conn-badge">
              <span className={`dot ${connected ? 'green' : 'red'}`}></span>
              {connected ? 'Connecté' : 'Connexion...'}
            </div>

            <div className="input-row">
              <input
                className="room-input"
                placeholder="Code de la room"
                value={roomInput}
                onChange={e => setRoomInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                maxLength={8}
              />
              <button className="btn btn-primary" onClick={handleJoin} disabled={!roomInput.trim()}>
                Rejoindre
              </button>
            </div>

            <div className="divider"><span>ou</span></div>

            <button
              className="btn btn-outline"
              onClick={() => setRoomInput(generateRoomId())}
            >
              Générer un code aléatoire
            </button>
          </div>

          <p className="hint">Partage le code avec un ami pour jouer ensemble</p>
        </div>
      </div>
    );
  }

  // ── Game ───────────────────────────────────────────────────
  const gameOver = winInfo || isDraw;

  return (
    <div className="app">
      <Toast toasts={toasts} />

      <div className="game-layout">
        {/* Header */}
        <header className="game-header">
          <h1>Tic-Tac-Toe</h1>
          <div className="room-badge" onClick={copyRoom} title="Cliquer pour copier">
            <span>Room</span>
            <strong>{joinedRoom}</strong>
            <span className="copy-icon">⎘</span>
          </div>
        </header>

        {/* Scores */}
        <div className="scoreboard">
          <div className={`score-card ${playerSymbol === 'X' ? 'mine' : ''}`}>
            <span className="score-sym x">X</span>
            <span className="score-label">{playerSymbol === 'X' ? 'Toi' : 'Adversaire'}</span>
            <span className="score-num">{scores.X}</span>
          </div>
          <div className="score-card draw-card">
            <span className="score-label">Nul</span>
            <span className="score-num">{scores.draw}</span>
          </div>
          <div className={`score-card ${playerSymbol === 'O' ? 'mine' : ''}`}>
            <span className="score-sym o">O</span>
            <span className="score-label">{playerSymbol === 'O' ? 'Toi' : 'Adversaire'}</span>
            <span className="score-num">{scores.O}</span>
          </div>
        </div>

        {/* Status */}
        <div className="status-bar">
          {playerCount < 2 ? (
            <span className="status waiting">
              <span className="dots"><span/><span/><span/></span>
              En attente d'un adversaire
            </span>
          ) : gameOver ? (
            winInfo ? (
              <span className={`status ${winInfo.winner === playerSymbol ? 'win' : 'lose'}`}>
                {winInfo.winner === playerSymbol ? '🎉 Victoire !' : '😔 Défaite'}
              </span>
            ) : (
              <span className="status draw">🤝 Match nul</span>
            )
          ) : (
            <span className={`status ${isMyTurn ? 'my-turn' : 'their-turn'}`}>
              {isMyTurn ? `✨ Ton tour — joue les ${playerSymbol}` : `⏳ Tour de l'adversaire (${xIsNext ? 'X' : 'O'})`}
            </span>
          )}
        </div>

        {/* Board */}
        <Board
          squares={squares}
          onClick={handleClick}
          disabled={!isMyTurn || !!gameOver}
          winningLine={winInfo?.line}
        />

        {/* Actions */}
        <div className="actions">
          {gameOver && (
            <button className="btn btn-primary" onClick={handleReset}>
              Rejouer
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => { setJoinedRoom(''); setSquares(Array(9).fill(null)); setWinInfo(null); setDraw(false); setSymbol(null); setCount(0); setScores({ X:0, O:0, draw:0 }); }}>
            Quitter
          </button>
        </div>
      </div>
    </div>
  );
}
