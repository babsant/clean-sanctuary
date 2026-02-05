/**
 * Home Screen
 * Main landing page with quest recommendations.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, formatNumber } from '@/constants/theme';
import { QuestCard } from '@/components/QuestCard';
import { useApp } from '@/context/AppContext';
import { Quest, NamedRoom, generateDefaultNamedRooms, namedRoomIcons } from '@/models/types';
import { recommendationEngine } from '@/services/recommendations';

export default function HomeScreen() {
  const { userProfile, completedQuests, startQuest } = useApp();
  const [recommendedQuest, setRecommendedQuest] = useState<Quest | null>(null);
  const [quickWinQuest, setQuickWinQuest] = useState<Quest | null>(null);
  const [isCatchUp, setIsCatchUp] = useState(false);
  const [todayComplete, setTodayComplete] = useState(false);

  // Room selection modal state
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [pendingQuest, setPendingQuest] = useState<Quest | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [completedQuests]);

  const loadRecommendations = () => {
    const result = recommendationEngine.getRecommendedQuestWithContext(
      userProfile,
      completedQuests
    );
    const quickWin = recommendationEngine.getQuickWinQuest(
      userProfile,
      completedQuests
    );

    setRecommendedQuest(result.quest);
    setIsCatchUp(result.isCatchUp);
    setTodayComplete(result.todayComplete);

    // Only show quick win if it's actually shorter than the main quest
    if (quickWin && result.quest && quickWin.duration < result.quest.duration) {
      setQuickWinQuest(quickWin);
    } else {
      setQuickWinQuest(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const tone = userProfile.preferredTone;

    let timeGreeting = '';
    if (hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon';
    } else {
      timeGreeting = 'Good evening';
    }

    if (tone === 'playful') {
      return `${timeGreeting}! Ready for a little tidying?`;
    } else if (tone === 'practical') {
      return `${timeGreeting}. Here's your recommended task.`;
    } else {
      return `${timeGreeting}. Take your time today.`;
    }
  };

  // Get named rooms
  const namedRooms = userProfile.homeConfig.namedRooms ||
    generateDefaultNamedRooms(userProfile.homeConfig.bedrooms, userProfile.homeConfig.bathrooms, userProfile.homeConfig.hasPets);

  const handleStartQuest = (quest: Quest) => {
    // Check if this quest needs room selection
    if (quest.room === 'bedroom' || quest.room === 'bathroom') {
      const roomsOfType = namedRooms.filter((r) => r.type === quest.room);
      if (roomsOfType.length > 1) {
        // Multiple rooms of this type - show picker
        setPendingQuest(quest);
        setShowRoomModal(true);
        return;
      } else if (roomsOfType.length === 1) {
        // Only one room - auto-select it
        startQuest(quest, roomsOfType[0].id);
        router.push('/quest-detail');
        return;
      }
    }
    // No room selection needed
    startQuest(quest);
    router.push('/quest-detail');
  };

  const handleRoomSelected = (roomId: string) => {
    if (pendingQuest) {
      startQuest(pendingQuest, roomId);
      setPendingQuest(null);
      setShowRoomModal(false);
      router.push('/quest-detail');
    }
  };

  const handleHelpButton = () => {
    // Get a random quick quest (5-10 min) to reduce overwhelm
    const easyQuest = recommendationEngine.getEasiestQuest(completedQuests);
    if (easyQuest) {
      handleStartQuest(easyQuest);
    } else {
      // Fallback to quests tab if no easy quest available
      router.push('/(tabs)/quests');
    }
  };

  const getDaysAgo = (dateString?: string): number => {
    if (!dateString) return Infinity;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDaysAgo = (days: number): string => {
    if (days === Infinity) return 'Never';
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const getRoomStatus = (room: NamedRoom) => {
    const cleanedDays = getDaysAgo(room.lastCleaned);
    const deepCleanedDays = getDaysAgo(room.lastDeepCleaned);
    const urgent = cleanedDays > 3 || cleanedDays === Infinity;

    return {
      cleanedDays,
      deepCleanedDays,
      cleanedText: formatDaysAgo(cleanedDays),
      deepCleanedText: formatDaysAgo(deepCleanedDays),
      days: cleanedDays, // for sorting
      urgent,
    };
  };

  // Sort rooms by urgency (most urgent first)
  const sortedRooms = [...namedRooms].sort((a, b) => {
    const statusA = getRoomStatus(a);
    const statusB = getRoomStatus(b);
    return statusB.days - statusA.days;
  });

  // Get rooms that need attention (> 3 days or never cleaned)
  const roomsNeedingAttention = sortedRooms.filter((room) => {
    const status = getRoomStatus(room);
    return status.days > 3 || status.days === Infinity;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
        </View>

        {/* Today Complete Banner */}
        {todayComplete && (
          <View style={styles.completeBanner}>
            <View style={styles.completeIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.accent} />
            </View>
            <Text style={styles.completeTitle}>All done for today!</Text>
            <Text style={styles.completeSubtitle}>
              You've completed your daily tasks. Take a well-deserved break, or keep going below.
            </Text>
          </View>
        )}

        {/* Catch-up notice */}
        {isCatchUp && !todayComplete && (
          <View style={styles.catchUpNotice}>
            <Ionicons name="calendar-outline" size={16} color={Colors.accent} />
            <Text style={styles.catchUpText}>
              Great job today! Here's something you might have missed this week.
            </Text>
          </View>
        )}

        {/* Main Quest Card */}
        {recommendedQuest && (
          <View>
            <Text style={styles.sectionLabel}>
              {todayComplete
                ? 'Want to do more?'
                : isCatchUp
                ? 'Catch up from this week'
                : 'Recommended for you'}
            </Text>
            <QuestCard
              quest={recommendedQuest}
              style="hero"
              onPress={() => handleStartQuest(recommendedQuest)}
            />
          </View>
        )}

        {/* Quick Win Option - only show if shorter than main quest */}
        {quickWinQuest && quickWinQuest.id !== recommendedQuest?.id && (
          <View style={styles.quickWinSection}>
            <Text style={styles.sectionLabel}>
              Short on time? ({quickWinQuest.duration} min)
            </Text>
            <QuestCard
              quest={quickWinQuest}
              style="compact"
              onPress={() => handleStartQuest(quickWinQuest)}
            />
          </View>
        )}

        {/* "I don't know where to start" button */}
        <Pressable style={styles.helpButton} onPress={handleHelpButton}>
          <Ionicons
            name="help-circle-outline"
            size={20}
            color={Colors.textSecondary}
          />
          <Text style={styles.helpButtonText}>
            I don't know where to start
          </Text>
        </Pressable>

        {/* All Rooms Status */}
        {namedRooms.length > 0 && (
          <View style={styles.roomStatusSection}>
            <Text style={styles.sectionLabel}>Your Rooms</Text>
            <View style={styles.roomList}>
              {namedRooms.map((room) => {
                const status = getRoomStatus(room);
                const iconName = namedRoomIcons[room.type] || 'home-outline';
                return (
                  <View
                    key={room.id}
                    style={[
                      styles.roomRow,
                      status.urgent && styles.roomRowUrgent,
                    ]}
                  >
                    <View style={styles.roomRowLeft}>
                      <Ionicons
                        name={iconName as any}
                        size={16}
                        color={status.urgent ? Colors.error : Colors.accent}
                      />
                      <Text
                        style={[styles.roomRowName, status.urgent && styles.roomRowNameUrgent]}
                      >
                        {room.name}
                      </Text>
                    </View>
                    <View style={styles.roomRowRight}>
                      <Text style={[styles.roomRowDate, status.urgent && styles.roomRowDateUrgent]}>
                        {status.cleanedDays === Infinity ? 'Never' : status.cleanedDays === 0 ? 'Today' : `${status.cleanedDays}d`}
                      </Text>
                      <Text style={styles.roomRowSeparator}>·</Text>
                      <Text style={styles.roomRowDeep}>
                        {status.deepCleanedDays === Infinity ? '—' : status.deepCleanedDays === 0 ? 'Today' : `${status.deepCleanedDays}d`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.roomLegend}>
              <Text style={styles.roomLegendText}>Last cleaned · Deep clean</Text>
            </View>
          </View>
        )}

        {/* Stats Preview */}
        <View style={styles.statsPreview}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(userProfile.totalPoints)}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(userProfile.currentStreak)}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(userProfile.questsCompleted)}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </ScrollView>

      {/* Room Selection Modal */}
      <Modal
        visible={showRoomModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRoomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Which room?</Text>
              <Pressable onPress={() => setShowRoomModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              Select the {pendingQuest?.room} you're cleaning
            </Text>
            <View style={styles.roomOptionsList}>
              {namedRooms
                .filter((room) => room.type === pendingQuest?.room)
                .map((room) => {
                  const status = getRoomStatus(room);
                  const iconName = namedRoomIcons[room.type] || 'home-outline';
                  return (
                    <Pressable
                      key={room.id}
                      style={styles.roomOption}
                      onPress={() => handleRoomSelected(room.id)}
                    >
                      <View style={styles.roomOptionLeft}>
                        <Ionicons
                          name={iconName as any}
                          size={24}
                          color={Colors.accent}
                        />
                        <Text style={styles.roomOptionName}>{room.name}</Text>
                      </View>
                      <View style={styles.roomOptionRight}>
                        <Text style={[
                          styles.roomOptionStatus,
                          status.urgent && styles.roomStatusUrgent,
                        ]}>
                          {status.cleanedText}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                      </View>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.screenHorizontal,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  greeting: {
    marginBottom: Spacing.sm,
  },
  greetingText: {
    ...Typography.title2,
    color: Colors.text,
  },
  completeBanner: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.accentLight + '20',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  completeIconContainer: {
    marginBottom: Spacing.sm,
  },
  completeTitle: {
    ...Typography.title3,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  completeSubtitle: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  catchUpNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.accentLight + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  catchUpText: {
    ...Typography.subheadline,
    color: Colors.accent,
    flex: 1,
  },
  quickWinSection: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  helpButtonText: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
  },
  roomStatusSection: {
    gap: Spacing.xs,
  },
  roomList: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  roomRowUrgent: {
    backgroundColor: Colors.error + '08',
  },
  roomRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  roomRowName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  roomRowNameUrgent: {
    color: Colors.error,
  },
  roomRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomRowDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    minWidth: 32,
    textAlign: 'right',
  },
  roomRowDateUrgent: {
    color: Colors.error,
  },
  roomRowSeparator: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  roomRowDeep: {
    fontSize: 12,
    color: Colors.textTertiary,
    minWidth: 32,
    textAlign: 'right',
  },
  roomLegend: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.cardBorder + '30',
  },
  roomLegendText: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'right',
  },
  roomStatusUrgent: {
    color: Colors.error,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    ...Typography.title2,
    color: Colors.text,
  },
  modalSubtitle: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  roomOptionsList: {
    gap: Spacing.sm,
  },
  roomOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
  },
  roomOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roomOptionName: {
    ...Typography.body,
    color: Colors.text,
  },
  roomOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  roomOptionStatus: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statsPreview: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.cardCornerRadius,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.title2,
    color: Colors.text,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: Spacing.sm,
  },
});
