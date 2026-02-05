/**
 * Stepper Control Component
 * A numeric stepper for selecting values.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface StepperControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export function StepperControl({
  value,
  onChange,
  min = 0,
  max = 10,
  label,
}: StepperControlProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  const handleDecrement = () => {
    if (canDecrement) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      onChange(value + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleDecrement}
        style={[styles.button, !canDecrement && styles.buttonDisabled]}
        disabled={!canDecrement}
      >
        <Ionicons
          name="remove"
          size={28}
          color={canDecrement ? Colors.accent : Colors.textTertiary}
        />
      </Pressable>

      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>

      <Pressable
        onPress={handleIncrement}
        style={[styles.button, !canIncrement && styles.buttonDisabled]}
        disabled={!canIncrement}
      >
        <Ionicons
          name="add"
          size={28}
          color={canIncrement ? Colors.accent : Colors.textTertiary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  valueContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  value: {
    ...Typography.largeTitle,
    color: Colors.text,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
});
