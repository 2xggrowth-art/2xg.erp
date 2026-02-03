import { Delete } from 'lucide-react';

interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onClear: () => void;
  disabled?: boolean;
}

const NumericKeypad = ({ onDigit, onDelete, onClear, disabled = false }: NumericKeypadProps) => {
  const triggerHaptic = (duration: number = 10) => {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  const handleDigit = (digit: string) => {
    if (disabled) return;
    triggerHaptic(10);
    onDigit(digit);
  };

  const handleDelete = () => {
    if (disabled) return;
    triggerHaptic(20);
    onDelete();
  };

  const handleClear = () => {
    if (disabled) return;
    triggerHaptic(50);
    onClear();
  };

  const buttonClass = `
    w-full h-16 text-2xl font-semibold rounded-xl
    bg-gray-100 active:bg-gray-200
    transition-all duration-100 active:scale-95
    flex items-center justify-center
    disabled:opacity-50 disabled:cursor-not-allowed
    select-none touch-manipulation
  `;

  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      {/* Row 1: 1, 2, 3 */}
      <button
        type="button"
        onClick={() => handleDigit('1')}
        disabled={disabled}
        className={buttonClass}
      >
        1
      </button>
      <button
        type="button"
        onClick={() => handleDigit('2')}
        disabled={disabled}
        className={buttonClass}
      >
        2
      </button>
      <button
        type="button"
        onClick={() => handleDigit('3')}
        disabled={disabled}
        className={buttonClass}
      >
        3
      </button>

      {/* Row 2: 4, 5, 6 */}
      <button
        type="button"
        onClick={() => handleDigit('4')}
        disabled={disabled}
        className={buttonClass}
      >
        4
      </button>
      <button
        type="button"
        onClick={() => handleDigit('5')}
        disabled={disabled}
        className={buttonClass}
      >
        5
      </button>
      <button
        type="button"
        onClick={() => handleDigit('6')}
        disabled={disabled}
        className={buttonClass}
      >
        6
      </button>

      {/* Row 3: 7, 8, 9 */}
      <button
        type="button"
        onClick={() => handleDigit('7')}
        disabled={disabled}
        className={buttonClass}
      >
        7
      </button>
      <button
        type="button"
        onClick={() => handleDigit('8')}
        disabled={disabled}
        className={buttonClass}
      >
        8
      </button>
      <button
        type="button"
        onClick={() => handleDigit('9')}
        disabled={disabled}
        className={buttonClass}
      >
        9
      </button>

      {/* Row 4: Clear, 0, Delete */}
      <button
        type="button"
        onClick={handleClear}
        disabled={disabled}
        className={`${buttonClass} text-lg text-red-600 bg-red-50 active:bg-red-100`}
      >
        C
      </button>
      <button
        type="button"
        onClick={() => handleDigit('0')}
        disabled={disabled}
        className={buttonClass}
      >
        0
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={disabled}
        className={`${buttonClass} text-gray-600`}
      >
        <Delete size={24} />
      </button>
    </div>
  );
};

export default NumericKeypad;
