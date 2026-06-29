function Square({ value, onSquareClick, disabled, isWinning }) {
  return (
    <button
      className={`square${value ? ' filled' : ''}${isWinning ? ' winning' : ''}`}
      onClick={onSquareClick}
      disabled={disabled || !!value}
    >
      {value && (
        <span className={`symbol symbol-${value.toLowerCase()}`}>{value}</span>
      )}
    </button>
  );
}

export default Square;
