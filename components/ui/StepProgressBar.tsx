/**
 * Step Progress Bar Component
 * Shows progress through quest steps with smooth animation.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';

interface StepProgressBarProps {
  total: number;
  current: number;
}

export function StepProgressBar({ total, current }: StepProgressBarProps) {
  const progress = useSharedValue((current / total) * 100);

  useEffect(() => {
    progress.value = withSpring((current / total) * 100, {
      damping: 15,
      stiffness: 100,
    });
  }, [current, total]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.fill, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 6,
    backgroundColor: Colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
});
