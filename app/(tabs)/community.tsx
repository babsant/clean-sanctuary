/**
 * Community Screen
 * The Community Bonfire - gather around the fire together.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, formatNumber } from '@/constants/theme';
import { Card } from '@/components/ui';
import { useApp } from '@/context/AppContext';
import {
  useCommunityRock,
  useRecentContributions,
  calculateDecayedPosition,
  getBonfireMessage,
  getPeopleCount,
  getFireSize,
} from '@/services/community';

export default function CommunityScreen() {
  const { userProfile } = useApp();
  const { data: communityData, isLoading, error } = useCommunityRock();
  const { data: contributionsData } = useRecentContributions(5);

  // Get bonfire data
  const bonfire = communityData?.communityRock?.[0];
  const rawPosition = bonfire?.position ?? 0;
  const position = bonfire
    ? calculateDecayedPosition(rawPosition, bonfire.lastUpdated, bonfire.decayRate)
    : 0;
  const totalContributed = bonfire?.totalContributed ?? 0;
  const contributors = communityData?.users ?? [];
  const recentContributions = contributionsData?.contributions ?? [];

  // Calculate stats
  const activeContributors = contributors.length;
  const message = getBonfireMessage(position);
  const fireSize = getFireSize(position);
  const peopleCount = getPeopleCount(activeContributors, position);

  if (!userProfile.hasCommunityAccess) {
    return (
      <View style={styles.lockedContainer}>
        <View style={styles.lockedIcon}>
          <Ionicons name="bonfire-outline" size={48} color={Colors.textTertiary} />
        </View>
        <Text style={styles.lockedTitle}>Community Locked</Text>
        <Text style={styles.lockedDescription}>
          Earn {formatNumber(300 - userProfile.totalPoints)} more points to join the Community Bonfire.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading community...</Text>
      </View>
    );
  }

  // Fire colors based on size
  const fireColors = {
    ember: { primary: '#FF6B35', secondary: '#FF8C42' },
    small: { primary: '#FF6B35', secondary: '#FFA500' },
    medium: { primary: '#FF4500', secondary: '#FFD700' },
    large: { primary: '#FF4500', secondary: '#FFD700' },
    roaring: { primary: '#FF2400', secondary: '#FFD700' },
  };

  const currentFireColor = fireColors[fireSize];

  // Fire size dimensions
  const fireSizes = {
    ember: { width: 30, height: 25 },
    small: { width: 45, height: 40 },
    medium: { width: 60, height: 55 },
    large: { width: 75, height: 70 },
    roaring: { width: 90, height: 85 },
  };

  const currentFireSize = fireSizes[fireSize];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community Bonfire</Text>
        <Text style={styles.subtitle}>Gather around the fire together</Text>
      </View>

      {/* Bonfire Visualization */}
      <Card style={styles.bonfireCard} noPadding>
        <View style={styles.sceneContainer}>
          {/* Night sky background */}
          <View style={styles.nightSky}>
            {/* Stars */}
            {[...Array(12)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.star,
                  {
                    left: `${10 + (i * 7) % 80}%`,
                    top: `${10 + (i * 13) % 40}%`,
                    opacity: 0.4 + (i % 3) * 0.2,
                  },
                ]}
              />
            ))}
          </View>

          {/* Ground/snow */}
          <View style={styles.ground} />

          {/* People around the fire */}
          <View style={styles.peopleContainer}>
            {[...Array(peopleCount)].map((_, i) => {
              // Position people in a semi-circle around the fire
              const positions = [
                { left: '20%', bottom: 45 },   // left
                { left: '70%', bottom: 45 },   // right
                { left: '10%', bottom: 55 },   // far left
                { left: '80%', bottom: 55 },   // far right
                { left: '30%', bottom: 35 },   // inner left
                { left: '60%', bottom: 35 },   // inner right
                { left: '5%', bottom: 40 },    // edge left
                { left: '85%', bottom: 40 },   // edge right
              ];
              const pos = positions[i];
              const isLeft = i % 2 === 0;

              return (
                <View
                  key={i}
                  style={[
                    styles.person,
                    { left: pos.left, bottom: pos.bottom },
                  ]}
                >
                  {/* Head */}
                  <View style={styles.personHead} />
                  {/* Body */}
                  <View
                    style={[
                      styles.personBody,
                      { backgroundColor: ['#6B8E9F', '#8B7355', '#7B6B8D', '#5F7A61'][i % 4] },
                    ]}
                  />
                  {/* Arms reaching toward fire */}
                  <View
                    style={[
                      styles.personArms,
                      isLeft ? styles.armsRight : styles.armsLeft,
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {/* Fire */}
          <View style={styles.fireContainer}>
            {/* Logs */}
            <View style={styles.logs}>
              <View style={[styles.log, styles.logLeft]} />
              <View style={[styles.log, styles.logRight]} />
            </View>

            {/* Fire glow */}
            <View
              style={[
                styles.fireGlow,
                {
                  width: currentFireSize.width * 2.5,
                  height: currentFireSize.height * 2,
                  backgroundColor: currentFireColor.primary + '20',
                },
              ]}
            />

            {/* Flames */}
            <View
              style={[
                styles.flame,
                styles.flameOuter,
                {
                  width: currentFireSize.width,
                  height: currentFireSize.height,
                  backgroundColor: currentFireColor.primary,
                },
              ]}
            />
            <View
              style={[
                styles.flame,
                styles.flameInner,
                {
                  width: currentFireSize.width * 0.6,
                  height: currentFireSize.height * 0.7,
                  backgroundColor: currentFireColor.secondary,
                },
              ]}
            />
            {fireSize !== 'ember' && (
              <View
                style={[
                  styles.flame,
                  styles.flameCore,
                  {
                    width: currentFireSize.width * 0.3,
                    height: currentFireSize.height * 0.4,
                    backgroundColor: '#FFFACD',
                  },
                ]}
              />
            )}

            {/* Sparks for larger fires */}
            {(fireSize === 'large' || fireSize === 'roaring') && (
              <>
                <View style={[styles.spark, { left: -10, bottom: 60 }]} />
                <View style={[styles.spark, { left: 15, bottom: 75 }]} />
                <View style={[styles.spark, { left: 5, bottom: 80 }]} />
              </>
            )}
          </View>

          {/* Warmth indicator */}
          <View style={styles.warmthBadge}>
            <Ionicons name="flame" size={14} color={currentFireColor.primary} />
            <Text style={styles.warmthText}>{Math.round(position)}%</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${position}%` }]}
            />
          </View>
          <Text style={styles.progressLabel}>{Math.round(position)}% warmth</Text>
        </View>
      </Card>

      {/* Message */}
      <Text style={styles.message}>{message}</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Ionicons name="people" size={24} color={Colors.accent} />
          <Text style={styles.statValue}>{activeContributors}</Text>
          <Text style={styles.statLabel}>Contributors</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="star" size={24} color={Colors.highlight} />
          <Text style={styles.statValue}>{formatNumber(totalContributed)}</Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </Card>
      </View>

      {/* How It Works */}
      <Card style={styles.howItWorksCard}>
        <View style={styles.howItWorksHeader}>
          <Ionicons name="information-circle" size={20} color={Colors.accent} />
          <Text style={styles.sectionTitle}>How It Works</Text>
        </View>
        <Text style={styles.howItWorksText}>
          Every quest you complete adds fuel to the community bonfire.
          The more we contribute, the brighter and warmer it gets! But if we stop
          adding fuel, the fire slowly dies down...
        </Text>
        <View style={styles.howItWorksStats}>
          <Text style={styles.howItWorksStat}>100 pts = 1% warmth</Text>
          <Text style={styles.howItWorksStat}>Cools: 0.5%/hr after 4hrs</Text>
        </View>
      </Card>

      {/* Your Contribution */}
      <Card>
        <View style={styles.contributionHeader}>
          <Ionicons name="person" size={20} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Your Contribution</Text>
        </View>
        <View style={styles.contributionStats}>
          <View style={styles.contributionItem}>
            <Text style={styles.contributionValue}>{formatNumber(userProfile.weeklyPoints)}</Text>
            <Text style={styles.contributionLabel}>Points This Week</Text>
          </View>
          <View style={styles.contributionDivider} />
          <View style={styles.contributionItem}>
            <Text style={styles.contributionValue}>{formatNumber(userProfile.totalPoints)}</Text>
            <Text style={styles.contributionLabel}>All Time</Text>
          </View>
        </View>
        <Text style={styles.contributionHint}>
          Your weekly points automatically fuel the fire!
        </Text>
      </Card>

      {/* Recent Activity */}
      <Card>
        <View style={styles.activityHeader}>
          <Ionicons name="time" size={20} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Recent Fuel</Text>
        </View>

        {recentContributions.length > 0 ? (
          <View style={styles.activityList}>
            {recentContributions.map((contribution, index) => (
              <View key={contribution.id || index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="flame" size={16} color="#FF6B35" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>
                    Someone added +{contribution.amount} fuel
                  </Text>
                  <Text style={styles.activityTime}>
                    {formatTimeAgo(contribution.contributedAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyActivity}>
            <Ionicons name="bonfire-outline" size={32} color={Colors.textTertiary} />
            <Text style={styles.emptyActivityText}>
              No recent activity yet.{'\n'}Be the first to add fuel!
            </Text>
          </View>
        )}
      </Card>

      {/* Weekly Challenge */}
      <Card style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <Ionicons name="bonfire" size={24} color="#FF6B35" />
          <Text style={styles.challengeTitle}>Weekly Challenge</Text>
        </View>
        <Text style={styles.challengeDescription}>
          Keep the fire roaring at 100% before Sunday midnight.
          If we make it, we celebrate with a community fireworks show!
        </Text>
        <View style={styles.challengeProgress}>
          <Text style={styles.challengeLabel}>Warmth</Text>
          <Text style={styles.challengeValue}>{Math.round(position)}%</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.screenHorizontal,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xxl,
  },
  lockedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  lockedTitle: {
    ...Typography.title2,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  lockedDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  title: {
    ...Typography.title,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  bonfireCard: {
    overflow: 'hidden',
  },
  sceneContainer: {
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  nightSky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 40,
    backgroundColor: '#1a1a2e',
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#ffffff',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#2d4a3e',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  peopleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  person: {
    position: 'absolute',
    alignItems: 'center',
  },
  personHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD5C8',
    marginBottom: 2,
  },
  personBody: {
    width: 14,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#6B8E9F',
  },
  personArms: {
    position: 'absolute',
    top: 16,
    width: 16,
    height: 3,
    backgroundColor: '#FFD5C8',
    borderRadius: 1.5,
  },
  armsRight: {
    right: -8,
    transform: [{ rotate: '-20deg' }],
  },
  armsLeft: {
    left: -8,
    transform: [{ rotate: '20deg' }],
  },
  fireContainer: {
    position: 'absolute',
    bottom: 35,
    left: '50%',
    transform: [{ translateX: -20 }],
    alignItems: 'center',
  },
  logs: {
    position: 'absolute',
    bottom: -5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  log: {
    width: 40,
    height: 8,
    backgroundColor: '#5D4037',
    borderRadius: 4,
  },
  logLeft: {
    transform: [{ rotate: '25deg' }, { translateX: -5 }],
  },
  logRight: {
    transform: [{ rotate: '-25deg' }, { translateX: 5 }],
  },
  fireGlow: {
    position: 'absolute',
    bottom: -10,
    borderRadius: 100,
  },
  flame: {
    position: 'absolute',
    borderRadius: 50,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  flameOuter: {
    bottom: 5,
  },
  flameInner: {
    bottom: 10,
  },
  flameCore: {
    bottom: 15,
  },
  spark: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD700',
  },
  warmthBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  warmthText: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  progressContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.cardBackground,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  message: {
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
  },
  statValue: {
    ...Typography.title2,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  howItWorksCard: {
    backgroundColor: Colors.accentLight + '15',
    borderColor: Colors.accentLight + '40',
  },
  howItWorksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  howItWorksText: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  howItWorksStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.accentLight + '30',
  },
  howItWorksStat: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '600',
  },
  contributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text,
  },
  contributionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contributionItem: {
    flex: 1,
    alignItems: 'center',
  },
  contributionValue: {
    ...Typography.title2,
    color: Colors.accent,
  },
  contributionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  contributionDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.cardBorder,
  },
  contributionHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  activityList: {
    gap: Spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35' + '25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    ...Typography.subheadline,
    color: Colors.text,
  },
  activityTime: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  emptyActivity: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyActivityText: {
    ...Typography.subheadline,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  challengeCard: {
    backgroundColor: '#FF6B35' + '15',
    borderColor: '#FF6B35' + '40',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  challengeTitle: {
    ...Typography.headline,
    color: Colors.text,
  },
  challengeDescription: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  challengeProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#FF6B35' + '30',
  },
  challengeLabel: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
  },
  challengeValue: {
    ...Typography.title3,
    color: '#FF6B35',
  },
});
