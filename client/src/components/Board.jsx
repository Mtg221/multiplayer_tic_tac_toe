import Square from './Square';

function Board({ squares, onClick, disabled, winningLine }) {
  return (
    <div className="board">
      {squares.map((val, i) => (
        <Square
          key={i}
          value={val}
          onSquareClick={() => onClick(i)}
          disabled={disabled}
          isWinning={winningLine?.includes(i)}
        />
      ))}
    </div>
  );
}

export default Board;
