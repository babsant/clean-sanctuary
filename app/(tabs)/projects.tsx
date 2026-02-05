/**
 * Projects Screen
 * Placeholder for future guided cleaning projects feature.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';

export default function ProjectsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="albums-outline" size={80} color={Colors.textTertiary} />
        <Text style={styles.title}>Projects Coming Soon</Text>
        <Text style={styles.description}>
          Guided multi-step cleaning projects{'\n'}to help you tackle bigger goals.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenHorizontal,
  },
  title: {
    ...Typography.title2,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
