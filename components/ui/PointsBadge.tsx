/**
 * Points Badge Component
 * Displays earned points with optional animation.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface PointsBadgeProps {
  points: number;
  size?: 'small' | 'large';
}

export function PointsBadge({ points, size = 'large' }: PointsBadgeProps) {
  const isSmall = size === 'small';

  return (
    <View style={[styles.container, isSmall && styles.containerSmall]}>
      <Ionicons
        name="star"
        size={isSmall ? 16 : 32}
        color={Colors.highlight}
      />
      <Text style={[styles.points, isSmall && styles.pointsSmall]}>
        +{points}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.highlightLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 20,
  },
  containerSmall: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  points: {
    ...Typography.title,
    color: Colors.text,
  },
  pointsSmall: {
    ...Typography.headline,
  },
});
