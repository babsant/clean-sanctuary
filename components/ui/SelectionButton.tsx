/**
 * Selection Button Component
 * A toggleable button for selection lists (onboarding, etc).
 */

import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface SelectionButtonProps {
  title: string;
  subtitle?: string;
  isSelected: boolean;
  onPress: () => void;
}

export function SelectionButton({
  title,
  subtitle,
  isSelected,
  onPress,
}: SelectionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isSelected && styles.selected,
        pressed && !isSelected && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, isSelected && styles.selectedTitle]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, isSelected && styles.selectedSubtitle]}>
            {subtitle}
          </Text>
        )}
      </View>
      {isSelected && (
        <Ionicons name="checkmark" size={20} color={Colors.surface} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  selected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  pressed: {
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.headline,
    color: Colors.text,
  },
  selectedTitle: {
    color: Colors.surface,
  },
  subtitle: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  selectedSubtitle: {
    color: 'rgba(255,255,255,0.8)',
  },
});
