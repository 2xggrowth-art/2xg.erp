import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronRight, Check } from 'lucide-react';

interface SwipeToSubmitProps {
  onSubmit: () => void;
  disabled?: boolean;
  label?: string;
  successLabel?: string;
}

const SwipeToSubmit = ({
  onSubmit,
  disabled = false,
  label = 'Swipe to Submit',
  successLabel = 'Submitted!'
}: SwipeToSubmitProps) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const THRESHOLD = 0.9; // 90% to complete

  const triggerHaptic = useCallback((duration: number = 10) => {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }, []);

  const handleStart = useCallback((clientX: number) => {
    if (disabled || isComplete) return;
    setIsDragging(true);
    startXRef.current = clientX;
    currentXRef.current = clientX;
  }, [disabled, isComplete]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || disabled || isComplete || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth - 64; // Subtract button width
    const delta = clientX - startXRef.current;
    const newProgress = Math.max(0, Math.min(1, delta / containerWidth));

    currentXRef.current = clientX;
    setProgress(newProgress);

    // Haptic feedback at progress milestones
    if (newProgress > 0.5 && progress <= 0.5) {
      triggerHaptic(10);
    }
    if (newProgress > 0.75 && progress <= 0.75) {
      triggerHaptic(20);
    }
  }, [isDragging, disabled, isComplete, progress, triggerHaptic]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (progress >= THRESHOLD && !isComplete) {
      setIsComplete(true);
      setProgress(1);
      triggerHaptic(50);
      onSubmit();
    } else {
      setProgress(0);
    }
  }, [isDragging, progress, isComplete, onSubmit, triggerHaptic]);

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Mouse event handlers (for desktop testing)
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleEnd();
    }
  };

  // Reset when disabled changes
  useEffect(() => {
    if (disabled) {
      setProgress(0);
      setIsComplete(false);
    }
  }, [disabled]);

  return (
    <div
      ref={containerRef}
      className={`
        relative h-16 rounded-full overflow-hidden
        ${disabled ? 'bg-gray-200' : isComplete ? 'bg-green-500' : 'bg-gray-200'}
        transition-colors duration-300
        touch-none select-none
      `}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Progress fill */}
      <div
        className={`
          absolute inset-0 rounded-full
          ${isComplete ? 'bg-green-500' : 'bg-green-400'}
          transition-transform duration-100
        `}
        style={{
          transform: `scaleX(${progress})`,
          transformOrigin: 'left',
        }}
      />

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`
            text-sm font-semibold tracking-wide
            ${progress > 0.5 || isComplete ? 'text-white' : 'text-gray-500'}
            transition-colors duration-150
          `}
        >
          {isComplete ? successLabel : label}
        </span>
      </div>

      {/* Swipe button */}
      {!isComplete && (
        <div
          className={`
            absolute top-1 bottom-1 left-1 w-14 rounded-full
            bg-white shadow-md
            flex items-center justify-center
            cursor-grab active:cursor-grabbing
            ${disabled ? 'opacity-50' : ''}
            transition-transform duration-100
          `}
          style={{
            transform: `translateX(${progress * ((containerRef.current?.offsetWidth || 200) - 64)}px)`,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <ChevronRight
            size={24}
            className={`text-green-600 ${isDragging ? 'animate-pulse' : ''}`}
          />
        </div>
      )}

      {/* Success checkmark */}
      {isComplete && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Check size={28} className="text-white" />
        </div>
      )}
    </div>
  );
};

export default SwipeToSubmit;
