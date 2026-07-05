
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import {
  PRESENCE_ENTER_FADE_MS,
  PRESENCE_JOIN_INTERVAL_MS,
  PRESENCE_LEAVE_FADE_MS,
  PRESENCE_MAX_COMPANIONS,
  PRESENCE_MIN_COMPANIONS,
} from '../../constants/presence';
import { PresenceService } from '../../services/PresenceService';
import { PresenceCompanion } from '../../types/presence';

type DotState = PresenceCompanion & { leaving: boolean };

type PresenceDotProps = {
  companion: DotState;
  onFaded: (id: string) => void;
};

// 一つの気配。名前もアイコンも持たない、淡く呼吸するだけの光点。
function PresenceDot({ companion, onFaded }: PresenceDotProps) {
  const presence = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(companion.phase)).current;

  useEffect(() => {
    Animated.timing(presence, {
      toValue: 1,
      duration: PRESENCE_ENTER_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [presence]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2600 + companion.size * 120, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2600 + companion.size * 120, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [companion.size, pulse]);

  useEffect(() => {
    if (!companion.leaving) {
      return;
    }
    Animated.timing(presence, {
      toValue: 0,
      duration: PRESENCE_LEAVE_FADE_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onFaded(companion.id);
      }
    });
  }, [companion.id, companion.leaving, onFaded, presence]);

  const breathOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.95] });
  const breathScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dotWrap,
        {
          left: `${companion.x}%`,
          top: `${companion.y}%`,
          opacity: presence,
          transform: [{ scale: presence }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.glow,
          {
            width: companion.size * 4,
            height: companion.size * 4,
            borderRadius: companion.size * 2,
            backgroundColor: companion.hue,
            opacity: Animated.multiply(breathOpacity, 0.35),
            transform: [{ scale: breathScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.core,
          {
            width: companion.size,
            height: companion.size,
            borderRadius: companion.size,
            backgroundColor: companion.hue,
            opacity: breathOpacity,
            transform: [{ scale: breathScale }],
          },
        ]}
      />
    </Animated.View>
  );
}

type Props = {
  /** 視聴中かどうか。false になった瞬間から気配は増減させない */
  active: boolean;
  /** 同じ枠なら似た人数感になるようにするための鍵（例: 日付+レイド時刻） */
  seedKey: string;
};

// 「今一緒に耐えている人たち」の気配だけを見せる、名前もチャットも持たないレイヤー。
export function PresenceField({ active, seedKey }: Props) {
  const [companions, setCompanions] = useState<DotState[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const randomRef = useRef(Math.random);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleFaded = useCallback((id: string) => {
    setCompanions((current) => current.filter((item) => item.id !== id));
  }, []);

  const scheduleNext = useCallback(() => {
    clearTimer();
    const [minDelay, maxDelay] = PRESENCE_JOIN_INTERVAL_MS;
    const delay = minDelay + randomRef.current() * (maxDelay - minDelay);
    timerRef.current = setTimeout(() => {
      setCompanions((current) => {
        const alive = current.filter((item) => !item.leaving);
        const random = randomRef.current;
        const shouldJoin = alive.length < PRESENCE_MIN_COMPANIONS || (alive.length < PRESENCE_MAX_COMPANIONS && random() < 0.55);

        if (shouldJoin) {
          const newcomer = PresenceService.createCompanion(random, new Set());
          return [...current, { ...newcomer, leaving: false }];
        }

        if (alive.length > PRESENCE_MIN_COMPANIONS) {
          const index = Math.floor(random() * alive.length);
          const target = alive[index];
          return current.map((item) => (item.id === target.id ? { ...item, leaving: true } : item));
        }

        return current;
      });
      scheduleNext();
    }, delay);
  }, [clearTimer]);

  useEffect(() => {
    if (!active) {
      clearTimer();
      setCompanions([]);
      return undefined;
    }

    const initial = PresenceService.createInitialCompanions(seedKey);
    setCompanions(initial.map((item) => ({ ...item, leaving: false })));
    scheduleNext();

    return () => {
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, seedKey]);

  if (!active) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {companions.map((companion) => (
        <PresenceDot key={companion.id} companion={companion} onFaded={handleFaded} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dotWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  core: {
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
