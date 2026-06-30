
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_FRAME_COLOR_ID, getFrameColor } from '../constants/frame';
import { StorageService } from '../services/StorageService';
import { FrameColorId } from '../types/settings';
import { formatClock } from '../utils/date';

type ScreenFrameContextValue = {
  frameColorId: FrameColorId;
  frameColor: string;
  celebrating: boolean;
  celebrationTime: string | null;
  setFrameColorId: (id: FrameColorId) => void;
  refreshFrameColor: () => Promise<void>;
  triggerCelebration: (durationMs?: number, time?: string) => void;
};

const ScreenFrameContext = createContext<ScreenFrameContextValue | null>(null);

export function ScreenFrameProvider({ children }: { children: ReactNode }) {
  const [frameColorId, setFrameColorIdState] = useState<FrameColorId>(DEFAULT_FRAME_COLOR_ID);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationTime, setCelebrationTime] = useState<string | null>(null);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshFrameColor = useCallback(async () => {
    const settings = await StorageService.getSettings();
    setFrameColorIdState(settings.frameColorId);
  }, []);

  useEffect(() => {
    void refreshFrameColor();
  }, [refreshFrameColor]);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

  const setFrameColorId = useCallback((id: FrameColorId) => {
    setFrameColorIdState(id);
  }, []);

  const triggerCelebration = useCallback((durationMs = 7000, time?: string) => {
    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
    }
    setCelebrationTime(time ?? formatClock(new Date()));
    setCelebrating(true);
    celebrationTimerRef.current = setTimeout(() => {
      setCelebrating(false);
      setCelebrationTime(null);
      celebrationTimerRef.current = null;
    }, durationMs);
  }, []);

  const value = useMemo(
    () => ({
      frameColorId,
      frameColor: getFrameColor(frameColorId),
      celebrating,
      celebrationTime,
      setFrameColorId,
      refreshFrameColor,
      triggerCelebration,
    }),
    [celebrating, celebrationTime, frameColorId, refreshFrameColor, setFrameColorId, triggerCelebration],
  );

  return <ScreenFrameContext.Provider value={value}>{children}</ScreenFrameContext.Provider>;
}

export function useScreenFrame(): ScreenFrameContextValue {
  const context = useContext(ScreenFrameContext);
  if (!context) {
    throw new Error('useScreenFrame must be used within ScreenFrameProvider');
  }
  return context;
}
