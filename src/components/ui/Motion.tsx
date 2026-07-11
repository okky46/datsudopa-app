
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type EnterCardProps = {
  children: ReactNode;
  // カードの並び順。少しずつ遅らせて、順にフェードインさせる
  index?: number;
  style?: StyleProp<ViewStyle>;
};

// 画面表示時にカードが控えめにフェードインする共通ラッパー。揺れや移動は入れない。
export function EnterCard({ children, index = 0, style }: EnterCardProps) {
  return (
    <Animated.View entering={FadeIn.delay(index * 50).duration(220)} style={style}>
      {children}
    </Animated.View>
  );
}

type PressableScaleProps = PressableProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  // 押し込み時の縮小率
  scaleTo?: number;
};

// 押すとスプリングで沈み込む Pressable（ボタン・カード共通の押下アニメーション）
export function PressableScale({ children, style, scaleTo = 0.97, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 320 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        onPressOut?.(event);
      }}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
