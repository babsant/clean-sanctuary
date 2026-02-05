/**
 * Quest Card Component
 * Displays a quest with its details in card format.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';
import {
  Quest,
  categoryLabels,
  categoryIcons,
  categoryColors,
  formatDuration,
} from '@/models/types';

type QuestCardStyle = 'hero' | 'compact' | 'list';

interface QuestCardProps {
  quest: Quest;
  style?: QuestCardStyle;
  onPress: () => void;
}

export function QuestCard({ quest, style = 'hero', onPress }: QuestCardProps) {
  const isHero = style === 'hero';
  const isCompact = style === 'compact';
  const categoryColor = categoryColors[quest.category];
  const categoryIcon = categoryIcons[quest.category] as keyof typeof Ionicons.glyphMap;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isHero && styles.heroCard,
        isCompact && styles.compactCard,
        pressed && styles.pressed,
      ]}
    >
      {/* Category Badge */}
      <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
        <Ionicons name={categoryIcon} size={16} color={categoryColor} />
        <Text style={[styles.categoryText, { color: categoryColor }]}>
          {categoryLabels[quest.category]}
        </Text>
      </View>

      {/* Title & Subtitle */}
      <View style={styles.content}>
        <Text style={[styles.title, isCompact && styles.compactTitle]}>
          {quest.title}
        </Text>
        {quest.subtitle && !isCompact && (
          <Text style={styles.subtitle}>{quest.subtitle}</Text>
        )}
      </View>

      {/* Meta Info */}
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{formatDuration(quest.duration)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="list-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{quest.steps.length} steps</Text>
        </View>
      </View>

      {/* Action Arrow */}
      {isHero && (
        <View style={styles.action}>
          <Text style={styles.actionText}>Start Quest</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.accent} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.cardCornerRadius,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.cardPadding,
  },
  heroCard: {
    // Additional hero styling if needed
  },
  compactCard: {
    padding: Spacing.md,
  },
  pressed: {
    backgroundColor: Colors.background,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  content: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title2,
    color: Colors.text,
  },
  compactTitle: {
    ...Typography.headline,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  actionText: {
    ...Typography.button,
    color: Colors.accent,
  },
});
