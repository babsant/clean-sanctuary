/**
 * Community Preview Card Component
 * Shows a preview of the Sisyphus Rock community feature.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { PointsConfig } from '@/models/types';

interface CommunityPreviewCardProps {
  onPress?: () => void;
}

export function CommunityPreviewCard({ onPress }: CommunityPreviewCardProps) {
  const { userProfile } = useApp();
  const { hasCommunityAccess, isCommunityAccessActive, totalPoints, weeklyPoints } = userProfile;

  const isLocked = !hasCommunityAccess;
  const pointsNeeded = isLocked
    ? PointsConfig.communityUnlockThreshold - totalPoints
    : PointsConfig.weeklyMinimumForAccess - weeklyPoints;

  return (
    <Pressable
      style={[styles.container, isLocked && styles.locked]}
      onPress={onPress}
      disabled={isLocked}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, isLocked && styles.iconLocked]}>
        <Ionicons
          name={isLocked ? 'lock-closed' : 'people'}
          size={24}
          color={isLocked ? Colors.textTertiary : Colors.accent}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>
          {isLocked ? 'Community Locked' : 'Sisyphus Rock'}
        </Text>
        <Text style={styles.description}>
          {isLocked
            ? `Earn ${pointsNeeded} more points to unlock`
            : isCommunityAccessActive
            ? 'Join others in pushing the boulder!'
            : `Earn ${pointsNeeded} more points this week`}
        </Text>
      </View>

      {/* Arrow */}
      {!isLocked && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.textTertiary}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.cardCornerRadius,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  locked: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLocked: {
    backgroundColor: Colors.cardBorder,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.headline,
    color: Colors.text,
  },
  description: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
