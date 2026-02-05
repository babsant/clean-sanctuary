/**
 * Primary Button Component
 * A styled button with primary and ghost variants.
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '@/constants/theme';

type ButtonStyle = 'primary' | 'ghost';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: ButtonStyle;
  disabled?: boolean;
  loading?: boolean;
  containerStyle?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PrimaryButton({
  title,
  onPress,
  style = 'primary',
  disabled = false,
  loading = false,
  containerStyle,
}: PrimaryButtonProps) {
  const isPrimary = style === 'primary';
  const isDisabled = disabled || loading;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.button,
        isPrimary ? styles.primaryButton : styles.ghostButton,
        isDisabled && styles.disabled,
        containerStyle,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? Colors.surface : Colors.accent} />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary ? styles.primaryText : styles.ghostText,
            isDisabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: Spacing.buttonHeight,
    borderRadius: Spacing.buttonCornerRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.buttonPadding,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...Typography.button,
  },
  primaryText: {
    color: Colors.surface,
  },
  ghostText: {
    color: Colors.accent,
  },
  disabledText: {
    color: Colors.textTertiary,
  },
});
