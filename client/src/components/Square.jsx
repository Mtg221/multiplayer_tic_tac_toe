function Square({ value, onSquareClick, disabled }) {
  return (
    <button
      className="square"
      onClick={onSquareClick}
      disabled={disabled || value !== null}
    >
      {value}
    </button>
  );
}

export default Square;
