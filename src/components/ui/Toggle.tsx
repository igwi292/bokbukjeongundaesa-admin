export function Toggle({
  on,
  onClick,
  disabled,
}: {
  on: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`sw${on ? ' on' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
    >
      <span className="knob" />
    </button>
  );
}
