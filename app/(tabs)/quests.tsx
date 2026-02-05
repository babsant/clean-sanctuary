/**
 * Quests Screen
 * Browse all available quests organized by category.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { QuestCard } from '@/components/QuestCard';
import { useApp } from '@/context/AppContext';
import {
  Quest,
  QuestCategory,
  categoryLabels,
  categoryColors,
  categoryIcons,
  generateDefaultNamedRooms,
  namedRoomIcons,
} from '@/models/types';
import { allQuests, getQuestsByCategory } from '@/data/quests';

const ALL_CATEGORIES: QuestCategory[] = [
  'daily',
  'speedClean',
  'weekly',
  'monthly',
  'deepClean',
  'declutter',
  'laundry',
  'pet',
];

export default function QuestsScreen() {
  const { startQuest, userProfile } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<QuestCategory | 'all'>('all');

  // Room selection modal state
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [pendingQuest, setPendingQuest] = useState<Quest | null>(null);

  const { hasPets, bedrooms, bathrooms } = userProfile.homeConfig;

  // Get named rooms
  const namedRooms = userProfile.homeConfig.namedRooms ||
    generateDefaultNamedRooms(bedrooms, bathrooms, hasPets);

  const getDaysAgo = (dateString?: string): number => {
    if (!dateString) return Infinity;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDaysAgo = (days: number): string => {
    if (days === Infinity) return 'Never cleaned';
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  // Filter categories based on user's home config
  const availableCategories = useMemo(() => {
    return ALL_CATEGORIES.filter((cat) => {
      // Hide pet category if user has no pets
      if (cat === 'pet' && !hasPets) return false;
      return true;
    });
  }, [hasPets]);

  // Filter and sort quests based on user's home config
  const filteredQuests = useMemo(() => {
    let quests = selectedCategory === 'all'
      ? allQuests
      : getQuestsByCategory(selectedCategory);

    // Filter out pet quests if user has no pets
    if (!hasPets) {
      quests = quests.filter((q) => q.category !== 'pet');
    }

    // Sort quests to prioritize relevant rooms
    // More bathrooms = bathroom quests appear higher
    // More bedrooms = bedroom quests appear higher
    quests = [...quests].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Boost bathroom quests if multiple bathrooms
      if (bathrooms >= 2) {
        if (a.room === 'bathroom') scoreA += 10;
        if (b.room === 'bathroom') scoreB += 10;
      }

      // Boost bedroom quests if multiple bedrooms
      if (bedrooms >= 2) {
        if (a.room === 'bedroom') scoreA += 10;
        if (b.room === 'bedroom') scoreB += 10;
      }

      // For studios, boost living room and kitchen
      if (bedrooms === 0) {
        if (a.room === 'livingRoom' || a.room === 'kitchen') scoreA += 5;
        if (b.room === 'livingRoom' || b.room === 'kitchen') scoreB += 5;
      }

      return scoreB - scoreA;
    });

    return quests;
  }, [selectedCategory, hasPets, bedrooms, bathrooms]);

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

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <Pressable
          style={[
            styles.filterChip,
            selectedCategory === 'all' && styles.filterChipActive,
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedCategory === 'all' && styles.filterChipTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>

        {availableCategories.map((category) => {
          const isActive = selectedCategory === category;
          const icon = categoryIcons[category] as keyof typeof Ionicons.glyphMap;

          return (
            <Pressable
              key={category}
              style={[
                styles.filterChip,
                isActive && {
                  backgroundColor: categoryColors[category] + '20',
                  borderColor: categoryColors[category],
                },
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Ionicons
                name={icon}
                size={16}
                color={isActive ? categoryColors[category] : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  isActive && { color: categoryColors[category] },
                ]}
              >
                {categoryLabels[category]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Quest List */}
      <ScrollView
        contentContainerStyle={styles.questList}
        showsVerticalScrollIndicator={false}
      >
        {filteredQuests.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            style="list"
            onPress={() => handleStartQuest(quest)}
          />
        ))}
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
                  const days = getDaysAgo(room.lastCleaned);
                  const isUrgent = days > 3 || days === Infinity;
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
                          isUrgent && styles.roomStatusUrgent,
                        ]}>
                          {formatDaysAgo(days)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.cardBackground,
  },
  filterChipActive: {
    backgroundColor: Colors.accent + '20',
    borderColor: Colors.accent,
  },
  filterChipText: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.accent,
  },
  questList: {
    padding: Spacing.screenHorizontal,
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl,
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
  roomStatusUrgent: {
    color: Colors.error,
  },
});
