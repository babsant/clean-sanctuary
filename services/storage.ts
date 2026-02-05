/**
 * Storage Service
 * Handles persistence using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, defaultUserProfile } from '@/models/types';

// Storage Keys
const KEYS = {
  USER_PROFILE: 'userProfile',
  COMPLETED_QUESTS: 'completedQuests',
  QUEST_PROGRESS: 'questProgress',
  LAST_ACTIVE_DATE: 'lastActiveDate',
  ANONYMOUS_ID: 'anonymousId',
  CLEANING_HISTORY: 'cleaningHistory',
  ACCOUNT_CREATED: 'accountCreated',
};

// Quest Progress Type
export interface QuestProgress {
  questId: string;
  currentStepIndex: number;
  startedAt: string; // ISO date string
}

// Completed Quests Type (questId -> completion date)
export type CompletedQuests = Record<string, string>;

// Cleaning Session - tracks each completed quest with actual time
export interface CleaningSession {
  questId: string;
  questTitle: string;
  date: string; // ISO date string (YYYY-MM-DD)
  actualMinutes: number;
  completedAt: string; // ISO timestamp
}

// Cleaning History - array of all cleaning sessions
export type CleaningHistory = CleaningSession[];

class StorageService {
  // MARK: - User Profile

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }

  async loadUserProfile(): Promise<UserProfile> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      if (data) {
        return { ...defaultUserProfile, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
    return defaultUserProfile;
  }

  // MARK: - Completed Quests

  async saveCompletedQuest(questId: string, date: Date = new Date()): Promise<void> {
    try {
      const completed = await this.loadCompletedQuests();
      completed[questId] = date.toISOString();
      await AsyncStorage.setItem(KEYS.COMPLETED_QUESTS, JSON.stringify(completed));
    } catch (error) {
      console.error('Failed to save completed quest:', error);
    }
  }

  async loadCompletedQuests(): Promise<CompletedQuests> {
    try {
      const data = await AsyncStorage.getItem(KEYS.COMPLETED_QUESTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load completed quests:', error);
    }
    return {};
  }

  isQuestCompletedToday(questId: string, completedQuests: CompletedQuests): boolean {
    const completionDate = completedQuests[questId];
    if (!completionDate) return false;

    const completed = new Date(completionDate);
    const today = new Date();
    return (
      completed.getFullYear() === today.getFullYear() &&
      completed.getMonth() === today.getMonth() &&
      completed.getDate() === today.getDate()
    );
  }

  // MARK: - Quest Progress

  async saveQuestProgress(progress: QuestProgress): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.QUEST_PROGRESS, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save quest progress:', error);
    }
  }

  async loadQuestProgress(): Promise<QuestProgress | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.QUEST_PROGRESS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load quest progress:', error);
    }
    return null;
  }

  async clearQuestProgress(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.QUEST_PROGRESS);
    } catch (error) {
      console.error('Failed to clear quest progress:', error);
    }
  }

  // MARK: - Streak Tracking

  async updateStreak(profile: UserProfile): Promise<UserProfile> {
    try {
      const lastActiveStr = await AsyncStorage.getItem(KEYS.LAST_ACTIVE_DATE);
      const now = new Date();

      if (lastActiveStr) {
        const lastActive = new Date(lastActiveStr);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        const isYesterday =
          lastActive.getFullYear() === yesterday.getFullYear() &&
          lastActive.getMonth() === yesterday.getMonth() &&
          lastActive.getDate() === yesterday.getDate();

        const isToday =
          lastActive.getFullYear() === now.getFullYear() &&
          lastActive.getMonth() === now.getMonth() &&
          lastActive.getDate() === now.getDate();

        if (isYesterday) {
          // Consecutive day - increment streak
          profile.currentStreak += 1;
          profile.longestStreak = Math.max(profile.longestStreak, profile.currentStreak);
        } else if (!isToday) {
          // Streak broken
          profile.currentStreak = 1;
        }
        // If today, do nothing (already counted)
      } else {
        // First time
        profile.currentStreak = 1;
      }

      await AsyncStorage.setItem(KEYS.LAST_ACTIVE_DATE, now.toISOString());
      return profile;
    } catch (error) {
      console.error('Failed to update streak:', error);
      return profile;
    }
  }

  // MARK: - Weekly Points Reset

  checkWeeklyReset(profile: UserProfile): UserProfile {
    const now = new Date();
    const resetDate = profile.weeklyPointsResetDate
      ? new Date(profile.weeklyPointsResetDate)
      : null;

    // Get start of current week (Monday)
    const currentWeekStart = new Date(now);
    const dayOfWeek = currentWeekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
    currentWeekStart.setDate(currentWeekStart.getDate() - diff);
    currentWeekStart.setHours(0, 0, 0, 0);

    if (!resetDate || resetDate < currentWeekStart) {
      // Reset weekly points
      profile.weeklyPoints = 0;
      profile.weeklyPointsResetDate = currentWeekStart.toISOString();

      // Update community access based on last week's performance
      if (profile.hasCommunityAccess) {
        // Community access is maintained by weekly minimum
        // This will be updated when they complete quests
        profile.isCommunityAccessActive = false;
      }
    }

    return profile;
  }

  // MARK: - Anonymous ID (for community contributions)

  async getOrCreateAnonymousId(): Promise<string> {
    try {
      let anonymousId = await AsyncStorage.getItem(KEYS.ANONYMOUS_ID);
      if (!anonymousId) {
        // Generate a unique ID
        anonymousId = 'anon_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        await AsyncStorage.setItem(KEYS.ANONYMOUS_ID, anonymousId);
      }
      return anonymousId;
    } catch (error) {
      console.error('Failed to get/create anonymous ID:', error);
      return 'anon_' + Date.now().toString(36);
    }
  }

  // MARK: - Cleaning History

  async addCleaningSession(session: CleaningSession): Promise<void> {
    try {
      const history = await this.loadCleaningHistory();
      history.push(session);
      await AsyncStorage.setItem(KEYS.CLEANING_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to add cleaning session:', error);
    }
  }

  async loadCleaningHistory(): Promise<CleaningHistory> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CLEANING_HISTORY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load cleaning history:', error);
    }
    return [];
  }

  // Get dates with cleaning activity (for the activity grid)
  async getCleaningDates(): Promise<Set<string>> {
    const history = await this.loadCleaningHistory();
    return new Set(history.map(session => session.date));
  }

  // MARK: - Account Creation Date

  async getOrCreateAccountDate(): Promise<string> {
    try {
      let date = await AsyncStorage.getItem(KEYS.ACCOUNT_CREATED);
      if (!date) {
        date = new Date().toISOString();
        await AsyncStorage.setItem(KEYS.ACCOUNT_CREATED, date);
      }
      return date;
    } catch (error) {
      console.error('Failed to get/create account date:', error);
      return new Date().toISOString();
    }
  }

  // MARK: - Reset All

  async resetAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.USER_PROFILE,
        KEYS.COMPLETED_QUESTS,
        KEYS.QUEST_PROGRESS,
        KEYS.LAST_ACTIVE_DATE,
        KEYS.CLEANING_HISTORY,
        KEYS.ACCOUNT_CREATED,
        // Note: We keep ANONYMOUS_ID so the user maintains their community identity
      ]);
    } catch (error) {
      console.error('Failed to reset data:', error);
    }
  }
}

export const storageService = new StorageService();
