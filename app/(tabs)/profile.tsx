/**
 * Profile Screen
 * User stats, preferences, and settings.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  useWindowDimensions,
  Pressable,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, formatNumber } from '@/constants/theme';
import { Card } from '@/components/ui';
import { PrimaryButton } from '@/components/ui';
import { useApp } from '@/context/AppContext';
import {
  energyLevelData,
  appToneData,
  getHomeSize,
  PointsConfig,
  EnergyLevel,
  AppTone,
  HomeConfig,
  NamedRoom,
  generateDefaultNamedRooms,
  generateId,
  namedRoomIcons,
} from '@/models/types';

export default function ProfileScreen() {
  const { userProfile, cleaningHistory, accountCreatedDate, resetAllData, updateProfile } = useApp();
  const { width: screenWidth } = useWindowDimensions();
  const [editingPreference, setEditingPreference] = useState<'energy' | 'tone' | 'home' | null>(null);

  const homeSize = getHomeSize(userProfile.homeConfig);
  const energyLabel = userProfile.energyLevel
    ? energyLevelData[userProfile.energyLevel].label
    : 'Not set';
  const toneLabel = userProfile.preferredTone
    ? appToneData[userProfile.preferredTone].label
    : 'Not set';

  const handleUpdateEnergy = (level: EnergyLevel) => {
    updateProfile({ energyLevel: level });
    setEditingPreference(null);
  };

  const handleUpdateTone = (tone: AppTone) => {
    updateProfile({ preferredTone: tone });
    setEditingPreference(null);
  };

  const handleUpdateHomeConfig = (updates: Partial<HomeConfig>) => {
    const newConfig = { ...userProfile.homeConfig, ...updates };

    // Regenerate named rooms if bedroom/bathroom count or hasPets changes
    if ('bedrooms' in updates || 'bathrooms' in updates || 'hasPets' in updates) {
      const newBedrooms = updates.bedrooms ?? userProfile.homeConfig.bedrooms;
      const newBathrooms = updates.bathrooms ?? userProfile.homeConfig.bathrooms;
      const newHasPets = updates.hasPets ?? userProfile.homeConfig.hasPets;
      newConfig.namedRooms = generateDefaultNamedRooms(newBedrooms, newBathrooms, newHasPets);
    }

    updateProfile({ homeConfig: newConfig });
  };

  const handleUpdateRoomName = (roomId: string, newName: string) => {
    const updatedRooms = (userProfile.homeConfig.namedRooms || []).map((room) =>
      room.id === roomId ? { ...room, name: newName } : room
    );
    updateProfile({
      homeConfig: { ...userProfile.homeConfig, namedRooms: updatedRooms },
    });
  };

  // Initialize named rooms if they don't exist
  const namedRooms = userProfile.homeConfig.namedRooms ||
    generateDefaultNamedRooms(userProfile.homeConfig.bedrooms, userProfile.homeConfig.bathrooms, userProfile.homeConfig.hasPets);

  // Calculate actual total minutes from cleaning history
  const actualMinutesCleaned = useMemo(() => {
    return cleaningHistory.reduce((sum, session) => sum + session.actualMinutes, 0);
  }, [cleaningHistory]);

  // Generate activity grid data
  const activityGridData = useMemo(() => {
    const cleaningDates = new Set(cleaningHistory.map(s => s.date));
    const today = new Date();
    const accountStart = accountCreatedDate ? new Date(accountCreatedDate) : today;

    // Calculate weeks since account creation (at least 1 week)
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksSinceCreation = Math.max(1, Math.ceil((today.getTime() - accountStart.getTime()) / msPerWeek));
    const weeksToShow = Math.min(weeksSinceCreation, 12); // Cap at 12 weeks

    // Build grid starting from the most recent complete week
    const weeks: { date: Date; hasActivity: boolean }[][] = [];

    // Find this week's Saturday (end of week display)
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    // Start from weeksToShow weeks ago
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (weeksToShow * 7) + 1);

    let currentDate = new Date(startDate);
    let currentWeek: { date: Date; hasActivity: boolean }[] = [];

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasActivity = cleaningDates.has(dateStr);
      const isFuture = currentDate > today;

      currentWeek.push({
        date: new Date(currentDate),
        hasActivity: isFuture ? false : hasActivity,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [cleaningHistory, accountCreatedDate]);

  // Calculate square size based on screen width
  const gridPadding = Spacing.screenHorizontal * 2 + Spacing.cardPadding * 2;
  const squareGap = 3;
  const squaresPerRow = 7;
  const availableWidth = screenWidth - gridPadding - (squareGap * (squaresPerRow - 1));
  const squareSize = Math.floor(availableWidth / squaresPerRow);

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your progress, stats, and preferences. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetAllData(),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Stats Section */}
      <Card>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(userProfile.questsCompleted)}</Text>
            <Text style={styles.statLabel}>Quests Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(actualMinutesCleaned)}</Text>
            <Text style={styles.statLabel}>Minutes Cleaned</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(userProfile.currentStreak)}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(userProfile.longestStreak)}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
        </View>
      </Card>

      {/* Activity Grid */}
      <Card>
        <View style={styles.activityHeader}>
          <Ionicons name="calendar-outline" size={20} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Cleaning Activity</Text>
        </View>
        <View style={styles.dayLabels}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <Text key={i} style={[styles.dayLabel, { width: squareSize }]}>{day}</Text>
          ))}
        </View>
        <View style={styles.activityGrid}>
          {activityGridData.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.activityWeek}>
              {week.map((day, dayIndex) => {
                const isToday = day.date.toDateString() === new Date().toDateString();
                const isFuture = day.date > new Date();
                return (
                  <View
                    key={dayIndex}
                    style={[
                      styles.activitySquare,
                      {
                        width: squareSize,
                        height: squareSize,
                        backgroundColor: isFuture
                          ? 'transparent'
                          : day.hasActivity
                          ? Colors.accent
                          : Colors.cardBorder,
                        borderWidth: isToday ? 2 : 0,
                        borderColor: isToday ? Colors.text : 'transparent',
                      },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
        <View style={styles.activityLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSquare, { backgroundColor: Colors.cardBorder }]} />
            <Text style={styles.legendText}>No activity</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSquare, { backgroundColor: Colors.accent }]} />
            <Text style={styles.legendText}>Cleaned</Text>
          </View>
        </View>
      </Card>

      {/* Points Section */}
      <Card>
        <View style={styles.pointsHeader}>
          <Ionicons name="star" size={24} color={Colors.highlight} />
          <Text style={styles.sectionTitle}>Points</Text>
        </View>

        <View style={styles.pointsContainer}>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsLabel}>Total Points</Text>
            <Text style={styles.pointsValue}>{formatNumber(userProfile.totalPoints)}</Text>
          </View>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsLabel}>This Week</Text>
            <Text style={styles.pointsValue}>{formatNumber(userProfile.weeklyPoints)}</Text>
          </View>
        </View>

        {/* Community Access */}
        <View style={styles.communitySection}>
          <View style={styles.communityHeader}>
            <Ionicons
              name={userProfile.hasCommunityAccess ? 'people' : 'lock-closed'}
              size={20}
              color={
                userProfile.hasCommunityAccess
                  ? Colors.accent
                  : Colors.textTertiary
              }
            />
            <Text style={styles.communityTitle}>Community Access</Text>
          </View>
          <Text style={styles.communityDescription}>
            {userProfile.hasCommunityAccess
              ? userProfile.isCommunityAccessActive
                ? 'Active! You have access to the community.'
                : `Earn ${formatNumber(PointsConfig.weeklyMinimumForAccess - userProfile.weeklyPoints)} more points this week to maintain access.`
              : `Earn ${formatNumber(PointsConfig.communityUnlockThreshold - userProfile.totalPoints)} more points to unlock.`}
          </Text>
        </View>
      </Card>

      {/* Preferences Section */}
      <Card>
        <Text style={styles.sectionTitle}>Your Preferences</Text>

        <View style={styles.preferencesList}>
          <Pressable
            style={styles.preferenceItem}
            onPress={() => setEditingPreference('energy')}
          >
            <View style={styles.preferenceIcon}>
              <Ionicons name="flash-outline" size={20} color={Colors.accent} />
            </View>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceLabel}>Energy Level</Text>
              <Text style={styles.preferenceValue}>{energyLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </Pressable>

          <Pressable
            style={styles.preferenceItem}
            onPress={() => setEditingPreference('tone')}
          >
            <View style={styles.preferenceIcon}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.accent} />
            </View>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceLabel}>App Tone</Text>
              <Text style={styles.preferenceValue}>{toneLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </Pressable>

          <Pressable
            style={styles.preferenceItem}
            onPress={() => setEditingPreference('home')}
          >
            <View style={styles.preferenceIcon}>
              <Ionicons name="home-outline" size={20} color={Colors.accent} />
            </View>
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceLabel}>Home</Text>
              <Text style={styles.preferenceValue}>
                {userProfile.homeConfig.bedrooms === 0 ? 'Studio' : `${userProfile.homeConfig.bedrooms} bed`}, {userProfile.homeConfig.bathrooms} bath
                {userProfile.homeConfig.hasPets ? ' • Has pets' : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </Pressable>
        </View>
      </Card>

      {/* Energy Level Modal */}
      <Modal
        visible={editingPreference === 'energy'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingPreference(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Energy Level</Text>
            <Pressable onPress={() => setEditingPreference(null)}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </Pressable>
          </View>
          <Text style={styles.modalSubtitle}>How much energy do you have for cleaning?</Text>
          <View style={styles.optionsList}>
            {(Object.keys(energyLevelData) as EnergyLevel[]).map((level) => {
              const data = energyLevelData[level];
              const isSelected = userProfile.energyLevel === level;
              return (
                <Pressable
                  key={level}
                  style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                  onPress={() => handleUpdateEnergy(level)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {data.label}
                    </Text>
                    <Text style={styles.optionDescription}>{data.description}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* App Tone Modal */}
      <Modal
        visible={editingPreference === 'tone'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingPreference(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>App Tone</Text>
            <Pressable onPress={() => setEditingPreference(null)}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </Pressable>
          </View>
          <Text style={styles.modalSubtitle}>How would you like the app to talk to you?</Text>
          <View style={styles.optionsList}>
            {(Object.keys(appToneData) as AppTone[]).map((tone) => {
              const data = appToneData[tone];
              const isSelected = userProfile.preferredTone === tone;
              return (
                <Pressable
                  key={tone}
                  style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                  onPress={() => handleUpdateTone(tone)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {data.emoji} {data.label}
                    </Text>
                    <Text style={styles.optionDescription}>{data.description}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Home Config Modal */}
      <Modal
        visible={editingPreference === 'home'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingPreference(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Home Setup</Text>
            <Pressable onPress={() => setEditingPreference(null)}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </Pressable>
          </View>
          <Text style={styles.modalSubtitle}>Tell us about your home</Text>

          <ScrollView style={styles.homeConfigScroll} showsVerticalScrollIndicator={false}>
            {/* Bedrooms */}
            <View style={styles.configSection}>
              <Text style={styles.configLabel}>Bedrooms</Text>
              <View style={styles.counterRow}>
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <Pressable
                    key={num}
                    style={[
                      styles.counterButton,
                      userProfile.homeConfig.bedrooms === num && styles.counterButtonSelected,
                    ]}
                    onPress={() => handleUpdateHomeConfig({ bedrooms: num })}
                  >
                    <Text
                      style={[
                        styles.counterButtonText,
                        userProfile.homeConfig.bedrooms === num && styles.counterButtonTextSelected,
                      ]}
                    >
                      {num === 0 ? 'Studio' : num}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Bathrooms */}
            <View style={styles.configSection}>
              <Text style={styles.configLabel}>Bathrooms</Text>
              <View style={styles.counterRow}>
                {[1, 1.5, 2, 2.5, 3, 4].map((num) => (
                  <Pressable
                    key={num}
                    style={[
                      styles.counterButton,
                      userProfile.homeConfig.bathrooms === num && styles.counterButtonSelected,
                    ]}
                    onPress={() => handleUpdateHomeConfig({ bathrooms: num })}
                  >
                    <Text
                      style={[
                        styles.counterButtonText,
                        userProfile.homeConfig.bathrooms === num && styles.counterButtonTextSelected,
                      ]}
                    >
                      {num}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Pets */}
            <View style={styles.configSection}>
              <Text style={styles.configLabel}>Do you have pets?</Text>
              <View style={styles.petRow}>
                <Pressable
                  style={[
                    styles.petButton,
                    userProfile.homeConfig.hasPets && styles.petButtonSelected,
                  ]}
                  onPress={() => handleUpdateHomeConfig({ hasPets: true })}
                >
                  <Ionicons
                    name="paw"
                    size={24}
                    color={userProfile.homeConfig.hasPets ? Colors.accent : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.petButtonText,
                      userProfile.homeConfig.hasPets && styles.petButtonTextSelected,
                    ]}
                  >
                    Yes
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.petButton,
                    !userProfile.homeConfig.hasPets && styles.petButtonSelected,
                  ]}
                  onPress={() => handleUpdateHomeConfig({ hasPets: false })}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={24}
                    color={!userProfile.homeConfig.hasPets ? Colors.accent : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.petButtonText,
                      !userProfile.homeConfig.hasPets && styles.petButtonTextSelected,
                    ]}
                  >
                    No
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Named Rooms */}
            {namedRooms.length > 0 && (
              <View style={styles.configSection}>
                <Text style={styles.configLabel}>Name Your Rooms</Text>
                <Text style={styles.configSubLabel}>
                  Customize names to track cleaning for each room
                </Text>
                <View style={styles.roomsList}>
                  {namedRooms.map((room) => {
                    const iconName = namedRoomIcons[room.type] || 'home-outline';
                    return (
                      <View key={room.id} style={styles.roomInputRow}>
                        <Ionicons
                          name={iconName as any}
                          size={20}
                          color={Colors.textSecondary}
                        />
                        <TextInput
                          style={styles.roomInput}
                          value={room.name}
                          onChangeText={(text) => handleUpdateRoomName(room.id, text)}
                          placeholder={`${room.type.charAt(0).toUpperCase() + room.type.slice(1)} name`}
                          placeholderTextColor={Colors.textTertiary}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.configNote}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.textTertiary} />
              <Text style={styles.configNoteText}>
                Quest recommendations will adjust based on your home size.
                {!userProfile.homeConfig.hasPets && ' Pet quests are hidden.'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Suggestions Section */}
      <View style={styles.footerSection}>
        <Pressable
          style={styles.feedbackButton}
          onPress={() => Linking.openURL('mailto:cleansanctuary.app@gmail.com?subject=Suggestion%20for%20Clean%20Sanctuary')}
        >
          <Ionicons name="bulb-outline" size={20} color={Colors.accent} />
          <Text style={styles.feedbackButtonText}>Have a suggestion?</Text>
        </Pressable>

        <PrimaryButton
          title="Reset All Data"
          onPress={handleReset}
          style="ghost"
        />

        <Text style={styles.privacyNote}>
          All your personal data is stored locally on your device and is never uploaded to our servers.
          Only anonymous contribution data is shared with the community bonfire.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.screenHorizontal,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    width: '45%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  statValue: {
    ...Typography.title,
    color: Colors.accent,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
    textAlign: 'center',
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  pointsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  pointsValue: {
    ...Typography.title2,
    color: Colors.text,
  },
  communitySection: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginTop: Spacing.sm,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  communityTitle: {
    ...Typography.headline,
    color: Colors.text,
  },
  communityDescription: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  preferencesList: {
    gap: Spacing.md,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  preferenceValue: {
    ...Typography.body,
    color: Colors.text,
  },
  footerSection: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
    alignItems: 'center',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  feedbackButtonText: {
    ...Typography.body,
    color: Colors.accent,
  },
  privacyNote: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxs,
  },
  dayLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  activityGrid: {
    gap: 3,
  },
  activityWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activitySquare: {
    borderRadius: 4,
  },
  activityLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    ...Typography.title2,
    color: Colors.text,
  },
  modalSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  optionsList: {
    gap: Spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  optionItemSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight + '20',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    ...Typography.headline,
    color: Colors.text,
  },
  optionLabelSelected: {
    color: Colors.accent,
  },
  optionDescription: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  homeConfigScroll: {
    flex: 1,
  },
  configSection: {
    marginBottom: Spacing.lg,
  },
  configLabel: {
    ...Typography.headline,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  counterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  counterButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.cardBackground,
    minWidth: 50,
    alignItems: 'center',
  },
  counterButtonSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight + '30',
  },
  counterButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  counterButtonTextSelected: {
    color: Colors.accent,
    fontWeight: '600',
  },
  petRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  petButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.cardBackground,
  },
  petButtonSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight + '30',
  },
  petButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  petButtonTextSelected: {
    color: Colors.accent,
    fontWeight: '600',
  },
  configSubLabel: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  roomsList: {
    gap: Spacing.xs,
  },
  roomInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  roomInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    padding: 0,
  },
  configNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    padding: Spacing.md,
    backgroundColor: Colors.cardBorder + '50',
    borderRadius: 12,
    marginTop: Spacing.md,
  },
  configNoteText: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
