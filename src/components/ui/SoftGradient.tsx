
import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type RGBA = { r: number; g: number; b: number; a: number };

function parseColor(input: string): RGBA {
  const value = input.trim();
  if (value.startsWith('#')) {
    let hex = value.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (match) {
    const parts = match[1].split(',').map((p) => parseFloat(p.trim()));
    return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts[3] ?? 1 };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

function mix(a: RGBA, b: RGBA, t: number): string {
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  const al = a.a + (b.a - a.a) * t;
  return `rgba(${r}, ${g}, ${bl}, ${al})`;
}

function buildStops(colors: string[], steps: number): string[] {
  if (colors.length === 1) {
    return new Array(steps).fill(colors[0]);
  }
  const parsed = colors.map(parseColor);
  const segments = parsed.length - 1;
  const out: string[] = [];
  for (let i = 0; i < steps; i += 1) {
    const pos = (i / (steps - 1)) * segments;
    const idx = Math.min(segments - 1, Math.floor(pos));
    const localT = pos - idx;
    out.push(mix(parsed[idx], parsed[idx + 1], localT));
  }
  return out;
}

type Props = {
  colors: readonly string[];
  // 'horizontal' | 'vertical'
  direction?: 'horizontal' | 'vertical';
  steps?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

// expo-linear-gradient を使わず、補間した細いスライスを並べて滑らかな線形グラデーションを表現する。
export function SoftGradient({ colors, direction = 'horizontal', steps = 28, borderRadius = 0, style }: Props) {
  const stops = useMemo(() => buildStops([...colors], steps), [colors, steps]);
  const isHorizontal = direction === 'horizontal';

  return (
    <View style={[styles.base, { borderRadius, flexDirection: isHorizontal ? 'row' : 'column' }, style]}>
      {stops.map((color, index) => (
        <View key={index} style={[styles.slice, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  slice: {
    flex: 1,
  },
});
