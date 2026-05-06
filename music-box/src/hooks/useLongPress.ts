import { useCallback, useRef } from 'react';

interface LongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
}

export function useLongPress(
  onLongPress: () => void,
  onShortPress: () => void,
  delay = 500
): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const movedRef = useRef(false);

  const start = useCallback(() => {
    firedRef.current = false;
    movedRef.current = false;
    timerRef.current = setTimeout(() => {
      if (!movedRef.current) {
        firedRef.current = true;
        onLongPress();
      }
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const end = useCallback(() => {
    cancel();
    if (!firedRef.current && !movedRef.current) {
      onShortPress();
    }
    firedRef.current = false;
    movedRef.current = false;
  }, [cancel, onShortPress]);

  const move = useCallback(() => {
    movedRef.current = true;
    cancel();
  }, [cancel]);

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: end,
    onTouchMove: move,
  };
}
