import Square from './Square';

function Board({ squares, onClick, disabled }) {
  const renderSquare = (i) => (
    <Square
      value={squares[i]}
      onSquareClick={() => onClick(i)}
      disabled={disabled}
    />
  );

  return (
    <div className="board">
      <div className="board-row">
        {renderSquare(0)}
        {renderSquare(1)}
        {renderSquare(2)}
      </div>
      <div className="board-row">
        {renderSquare(3)}
        {renderSquare(4)}
        {renderSquare(5)}
      </div>
      <div className="board-row">
        {renderSquare(6)}
        {renderSquare(7)}
        {renderSquare(8)}
      </div>
    </div>
  );
}

export default Board;
