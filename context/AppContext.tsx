/**
 * App Context
 * Central state management for the ADHD Cleaning App
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  Quest,
  PointsConfig,
  defaultUserProfile,
  generateDefaultNamedRooms,
} from '@/models/types';
import { storageService, CompletedQuests, QuestProgress, CleaningHistory, PausedQuestData } from '@/services/storage';
import { contributePoints } from '@/services/community';

// MARK: - State Types

interface AppState {
  isLoading: boolean;
  userProfile: UserProfile;
  hasCompletedOnboarding: boolean;
  activeQuest: Quest | null;
  activeRoomId: string | null; // Which specific room is being cleaned
  currentQuestStep: number;
  questStartTime: string | null;
  stepStartTime: string | null; // When current step started (for pause detection)
  lastEarnedPoints: number;
  completedQuests: CompletedQuests;
  cleaningHistory: CleaningHistory;
  accountCreatedDate: string | null;
  pausedQuest: PausedQuestData | null; // Quest that was paused mid-progress
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER_PROFILE'; payload: UserProfile }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'START_QUEST'; payload: { quest: Quest; startTime: string; stepStartTime: string; roomId?: string } }
  | { type: 'ADVANCE_QUEST_STEP'; payload: { stepStartTime: string } }
  | { type: 'COMPLETE_QUEST'; payload: number }
  | { type: 'SKIP_QUEST' }
  | { type: 'PAUSE_QUEST' }
  | { type: 'SET_PAUSED_QUEST'; payload: PausedQuestData | null }
  | { type: 'RESUME_QUEST'; payload: { quest: Quest; stepIndex: number; questStartTime: string; stepStartTime: string; roomId?: string } }
  | { type: 'SET_COMPLETED_QUESTS'; payload: CompletedQuests }
  | { type: 'ADD_COMPLETED_QUEST'; payload: { questId: string; date: string } }
  | { type: 'SET_CLEANING_HISTORY'; payload: CleaningHistory }
  | { type: 'ADD_CLEANING_SESSION'; payload: CleaningHistory[0] }
  | { type: 'SET_ACCOUNT_DATE'; payload: string }
  | { type: 'RESET_ALL' };

// MARK: - Initial State

const initialState: AppState = {
  isLoading: true,
  userProfile: defaultUserProfile,
  hasCompletedOnboarding: false,
  activeQuest: null,
  activeRoomId: null,
  currentQuestStep: 0,
  questStartTime: null,
  stepStartTime: null,
  lastEarnedPoints: 0,
  completedQuests: {},
  cleaningHistory: [],
  accountCreatedDate: null,
  pausedQuest: null,
};

// MARK: - Reducer

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_USER_PROFILE':
      return {
        ...state,
        userProfile: action.payload,
        hasCompletedOnboarding: action.payload.hasCompletedOnboarding,
      };

    case 'UPDATE_USER_PROFILE':
      const updatedProfile = { ...state.userProfile, ...action.payload };
      return {
        ...state,
        userProfile: updatedProfile,
        hasCompletedOnboarding: updatedProfile.hasCompletedOnboarding,
      };

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        userProfile: { ...state.userProfile, hasCompletedOnboarding: true },
        hasCompletedOnboarding: true,
      };

    case 'START_QUEST':
      return {
        ...state,
        activeQuest: action.payload.quest,
        activeRoomId: action.payload.roomId || null,
        currentQuestStep: 0,
        questStartTime: action.payload.startTime,
        stepStartTime: action.payload.stepStartTime,
      };

    case 'ADVANCE_QUEST_STEP':
      return {
        ...state,
        currentQuestStep: state.currentQuestStep + 1,
        stepStartTime: action.payload.stepStartTime,
      };

    case 'PAUSE_QUEST':
      return {
        ...state,
        activeQuest: null,
        activeRoomId: null,
        currentQuestStep: 0,
        questStartTime: null,
        stepStartTime: null,
      };

    case 'SET_PAUSED_QUEST':
      return {
        ...state,
        pausedQuest: action.payload,
      };

    case 'RESUME_QUEST':
      return {
        ...state,
        activeQuest: action.payload.quest,
        activeRoomId: action.payload.roomId || null,
        currentQuestStep: action.payload.stepIndex,
        questStartTime: action.payload.questStartTime,
        stepStartTime: action.payload.stepStartTime,
        pausedQuest: null,
      };

    case 'COMPLETE_QUEST':
      return {
        ...state,
        activeQuest: null,
        activeRoomId: null,
        currentQuestStep: 0,
        questStartTime: null,
        lastEarnedPoints: action.payload,
      };

    case 'SKIP_QUEST':
      return {
        ...state,
        activeQuest: null,
        activeRoomId: null,
        currentQuestStep: 0,
        questStartTime: null,
      };

    case 'SET_COMPLETED_QUESTS':
      return {
        ...state,
        completedQuests: action.payload,
      };

    case 'ADD_COMPLETED_QUEST':
      return {
        ...state,
        completedQuests: {
          ...state.completedQuests,
          [action.payload.questId]: action.payload.date,
        },
      };

    case 'SET_CLEANING_HISTORY':
      return {
        ...state,
        cleaningHistory: action.payload,
      };

    case 'ADD_CLEANING_SESSION':
      return {
        ...state,
        cleaningHistory: [...state.cleaningHistory, action.payload],
      };

    case 'SET_ACCOUNT_DATE':
      return {
        ...state,
        accountCreatedDate: action.payload,
      };

    case 'RESET_ALL':
      return {
        ...initialState,
        isLoading: false,
      };

    default:
      return state;
  }
}

// MARK: - Context

interface AppContextType extends AppState {
  // Profile Actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // Quest Actions
  startQuest: (quest: Quest, roomId?: string) => Promise<void>;
  advanceQuestStep: () => Promise<void>;
  completeQuest: () => Promise<number>;
  skipQuest: () => Promise<void>;
  pauseQuest: () => Promise<void>;
  resumeQuest: () => Promise<void>;
  dismissPausedQuest: () => Promise<void>;

  // Data Actions
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// MARK: - Provider

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        let profile = await storageService.loadUserProfile();

        // Check for weekly reset
        profile = storageService.checkWeeklyReset(profile);

        // Ensure namedRooms is populated with all room types
        if (!profile.homeConfig.namedRooms || profile.homeConfig.namedRooms.length === 0) {
          profile.homeConfig.namedRooms = generateDefaultNamedRooms(
            profile.homeConfig.bedrooms,
            profile.homeConfig.bathrooms,
            profile.homeConfig.hasPets,
          );
        } else {
          // Migration: add missing room types while preserving existing room data
          const existingTypes = new Set(profile.homeConfig.namedRooms.map(r => r.type));
          const allRooms = generateDefaultNamedRooms(
            profile.homeConfig.bedrooms,
            profile.homeConfig.bathrooms,
            profile.homeConfig.hasPets,
          );
          const missingRooms = allRooms.filter(r => !existingTypes.has(r.type));
          if (missingRooms.length > 0) {
            profile.homeConfig.namedRooms = [...profile.homeConfig.namedRooms, ...missingRooms];
          }
        }

        await storageService.saveUserProfile(profile);

        const completedQuests = await storageService.loadCompletedQuests();
        const cleaningHistory = await storageService.loadCleaningHistory();
        const accountDate = await storageService.getOrCreateAccountDate();
        const pausedQuest = await storageService.loadPausedQuest();

        dispatch({ type: 'SET_USER_PROFILE', payload: profile });
        dispatch({ type: 'SET_COMPLETED_QUESTS', payload: completedQuests });
        dispatch({ type: 'SET_CLEANING_HISTORY', payload: cleaningHistory });
        dispatch({ type: 'SET_ACCOUNT_DATE', payload: accountDate });
        dispatch({ type: 'SET_PAUSED_QUEST', payload: pausedQuest });
      } catch (error) {
        console.error('Failed to load app data:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }

    loadData();
  }, []);

  // MARK: - Profile Actions

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const newProfile = { ...state.userProfile, ...updates };
    dispatch({ type: 'UPDATE_USER_PROFILE', payload: updates });
    await storageService.saveUserProfile(newProfile);
  };

  const completeOnboarding = async () => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    const newProfile = { ...state.userProfile, hasCompletedOnboarding: true };
    await storageService.saveUserProfile(newProfile);
  };

  // MARK: - Quest Actions

  const startQuest = async (quest: Quest, roomId?: string) => {
    const startTime = new Date().toISOString();
    dispatch({ type: 'START_QUEST', payload: { quest, startTime, stepStartTime: startTime, roomId } });

    const progress: QuestProgress = {
      questId: quest.id,
      currentStepIndex: 0,
      startedAt: startTime,
    };
    await storageService.saveQuestProgress(progress);
  };

  const advanceQuestStep = async () => {
    if (!state.activeQuest) return;

    if (state.currentQuestStep < state.activeQuest.steps.length - 1) {
      const stepStartTime = new Date().toISOString();
      dispatch({ type: 'ADVANCE_QUEST_STEP', payload: { stepStartTime } });

      const progress: QuestProgress = {
        questId: state.activeQuest.id,
        currentStepIndex: state.currentQuestStep + 1,
        startedAt: stepStartTime,
      };
      await storageService.saveQuestProgress(progress);
    }
  };

  const completeQuest = async (): Promise<number> => {
    if (!state.activeQuest) return 0;

    const quest = state.activeQuest;
    const now = new Date();

    // Calculate actual minutes spent
    let actualMinutes = quest.duration; // fallback to quest duration
    if (state.questStartTime) {
      const startTime = new Date(state.questStartTime);
      const elapsedMs = now.getTime() - startTime.getTime();
      actualMinutes = Math.max(1, Math.round(elapsedMs / (1000 * 60)));
    }

    // Mark as completed
    await storageService.saveCompletedQuest(quest.id);
    dispatch({
      type: 'ADD_COMPLETED_QUEST',
      payload: { questId: quest.id, date: now.toISOString() },
    });

    // Save to cleaning history
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const cleaningSession = {
      questId: quest.id,
      questTitle: quest.title,
      date: dateStr,
      actualMinutes,
      completedAt: now.toISOString(),
    };
    await storageService.addCleaningSession(cleaningSession);
    dispatch({ type: 'ADD_CLEANING_SESSION', payload: cleaningSession });

    // Calculate points
    const earnedPoints = PointsConfig.getPoints(quest.category, quest.duration);

    // Update room lastCleaned if a specific room was selected
    let updatedNamedRooms = state.userProfile.homeConfig.namedRooms || [];
    const isDeepClean = quest.category === 'deepClean';

    if (state.activeRoomId) {
      // Update the specific room that was selected
      updatedNamedRooms = updatedNamedRooms.map((room) => {
        if (room.id === state.activeRoomId) {
          const updates: { lastCleaned: string; lastDeepCleaned?: string } = {
            lastCleaned: now.toISOString(),
          };
          // Also update lastDeepCleaned if this was a deep clean
          if (isDeepClean) {
            updates.lastDeepCleaned = now.toISOString();
          }
          return { ...room, ...updates };
        }
        return room;
      });
    }

    // Update profile with actual minutes
    let updatedProfile: UserProfile = {
      ...state.userProfile,
      questsCompleted: state.userProfile.questsCompleted + 1,
      totalMinutesCleaned: state.userProfile.totalMinutesCleaned + actualMinutes,
      totalPoints: state.userProfile.totalPoints + earnedPoints,
      weeklyPoints: state.userProfile.weeklyPoints + earnedPoints,
      homeConfig: {
        ...state.userProfile.homeConfig,
        namedRooms: updatedNamedRooms,
      },
    };

    // Check community unlock
    if (
      !updatedProfile.hasCommunityAccess &&
      updatedProfile.totalPoints >= PointsConfig.communityUnlockThreshold
    ) {
      updatedProfile.hasCommunityAccess = true;
      updatedProfile.communityUnlockDate = new Date().toISOString();
    }

    // Check weekly community access
    if (
      updatedProfile.hasCommunityAccess &&
      updatedProfile.weeklyPoints >= PointsConfig.weeklyMinimumForAccess
    ) {
      updatedProfile.isCommunityAccessActive = true;
    }

    // Contribute to community if user has access
    if (updatedProfile.hasCommunityAccess) {
      try {
        const anonymousId = await storageService.getOrCreateAnonymousId();
        await contributePoints(anonymousId, earnedPoints);
      } catch (error) {
        console.error('Failed to contribute to community:', error);
        // Don't block quest completion if community contribution fails
      }
    }

    // Update streak
    updatedProfile = await storageService.updateStreak(updatedProfile);

    await storageService.saveUserProfile(updatedProfile);
    await storageService.clearQuestProgress();

    dispatch({ type: 'SET_USER_PROFILE', payload: updatedProfile });
    dispatch({ type: 'COMPLETE_QUEST', payload: earnedPoints });

    return earnedPoints;
  };

  const skipQuest = async () => {
    dispatch({ type: 'SKIP_QUEST' });
    await storageService.clearQuestProgress();
  };

  const pauseQuest = async () => {
    if (!state.activeQuest || !state.questStartTime || !state.stepStartTime) return;

    const pausedData: PausedQuestData = {
      quest: state.activeQuest,
      currentStepIndex: state.currentQuestStep,
      roomId: state.activeRoomId || undefined,
      pausedAt: new Date().toISOString(),
      stepStartedAt: state.stepStartTime,
      questStartTime: state.questStartTime,
    };

    await storageService.savePausedQuest(pausedData);
    await storageService.clearQuestProgress();

    dispatch({ type: 'SET_PAUSED_QUEST', payload: pausedData });
    dispatch({ type: 'PAUSE_QUEST' });
  };

  const resumeQuest = async () => {
    if (!state.pausedQuest) return;

    const { quest, currentStepIndex, roomId, questStartTime } = state.pausedQuest;
    const stepStartTime = new Date().toISOString();

    dispatch({
      type: 'RESUME_QUEST',
      payload: { quest, stepIndex: currentStepIndex, questStartTime, stepStartTime, roomId },
    });

    // Save quest progress
    const progress: QuestProgress = {
      questId: quest.id,
      currentStepIndex,
      startedAt: stepStartTime,
    };
    await storageService.saveQuestProgress(progress);
    await storageService.clearPausedQuest();
  };

  const dismissPausedQuest = async () => {
    await storageService.clearPausedQuest();
    dispatch({ type: 'SET_PAUSED_QUEST', payload: null });
  };

  // MARK: - Data Actions

  const resetAllData = async () => {
    await storageService.resetAllData();
    dispatch({ type: 'RESET_ALL' });
  };

  const value: AppContextType = {
    ...state,
    updateProfile,
    completeOnboarding,
    startQuest,
    advanceQuestStep,
    completeQuest,
    skipQuest,
    pauseQuest,
    resumeQuest,
    dismissPausedQuest,
    resetAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// MARK: - Hook

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
