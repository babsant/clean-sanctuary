/**
 * Core data models for the ADHD Cleaning App
 */

// MARK: - Quest Types

export interface QuestStep {
  id: string;
  instruction: string;
  explanation?: string;
  duration?: number; // minutes
}

export type QuestCategory =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'seasonal'
  | 'speedClean'
  | 'deepClean'
  | 'declutter'
  | 'laundry'
  | 'pet';

export type QuestFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'adhoc';

export type Room =
  | 'kitchen'
  | 'bathroom'
  | 'bedroom'
  | 'livingRoom'
  | 'office'
  | 'laundryRoom'
  | 'garage'
  | 'entryway'
  | 'storage'
  | 'outdoor'
  | 'playroom'
  | 'wholeHome';

export interface Quest {
  id: string;
  title: string;
  subtitle: string;
  category: QuestCategory;
  frequency: QuestFrequency;
  duration: number; // minutes
  steps: QuestStep[];
  room?: Room;
}

// MARK: - Category Helpers

export const categoryLabels: Record<QuestCategory, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  seasonal: 'Seasonal',
  speedClean: 'Speed Clean',
  deepClean: 'Deep Clean',
  declutter: 'Declutter',
  laundry: 'Laundry',
  pet: 'Pet Care',
};

export const categoryIcons: Record<QuestCategory, string> = {
  daily: 'sunny-outline',
  weekly: 'calendar-outline',
  monthly: 'calendar-number-outline',
  seasonal: 'leaf-outline',
  speedClean: 'flash-outline',
  deepClean: 'sparkles-outline',
  declutter: 'archive-outline',
  laundry: 'water-outline',
  pet: 'paw-outline',
};

export const categoryColors: Record<QuestCategory, string> = {
  daily: '#E9B872',
  weekly: '#7C9885',
  monthly: '#8B9DC3',
  seasonal: '#C9A87C',
  speedClean: '#E07A5F',
  deepClean: '#81B29A',
  declutter: '#9B8AA6',
  laundry: '#6B9AC4',
  pet: '#D4A373',
};

export const roomLabels: Record<Room, string> = {
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  bedroom: 'Bedroom',
  livingRoom: 'Living Room',
  office: 'Office',
  laundryRoom: 'Laundry Room',
  garage: 'Garage',
  entryway: 'Entryway',
  storage: 'Storage',
  outdoor: 'Outdoor',
  playroom: 'Playroom',
  wholeHome: 'Whole Home',
};

export const roomIcons: Record<Room, string> = {
  kitchen: 'restaurant-outline',
  bathroom: 'water-outline',
  bedroom: 'bed-outline',
  livingRoom: 'tv-outline',
  office: 'desktop-outline',
  laundryRoom: 'water-outline',
  garage: 'car-outline',
  entryway: 'enter-outline',
  storage: 'cube-outline',
  outdoor: 'leaf-outline',
  playroom: 'game-controller-outline',
  wholeHome: 'home-outline',
};

// MARK: - User Profile Types

export type SpaceFeeling = 'overwhelmed' | 'frustrated' | 'hopeful' | 'motivated';

export const spaceFeelingData: Record<SpaceFeeling, { label: string; description: string; emoji: string }> = {
  overwhelmed: { label: 'Overwhelmed', description: "I don't know where to begin", emoji: '😰' },
  frustrated: { label: 'Frustrated', description: "I've tried but nothing sticks", emoji: '😤' },
  hopeful: { label: 'Hopeful', description: 'I want to make it better', emoji: '🌱' },
  motivated: { label: 'Ready to start', description: "Let's do this!", emoji: '💪' },
};

export type CleaningStruggle =
  | 'starting'
  | 'finishing'
  | 'consistency'
  | 'motivation'
  | 'time'
  | 'deciding';

export const cleaningStruggleData: Record<CleaningStruggle, { label: string; description: string }> = {
  starting: { label: 'Getting started', description: 'The hardest part is beginning' },
  finishing: { label: 'Finishing tasks', description: 'I start but rarely finish' },
  consistency: { label: 'Being consistent', description: "I can't keep a routine" },
  motivation: { label: 'Staying motivated', description: 'I lose interest quickly' },
  time: { label: 'Finding time', description: 'Life gets in the way' },
  deciding: { label: 'Deciding what to do', description: 'Too many choices paralyze me' },
};

export type EnergyLevel = 'veryLow' | 'low' | 'medium' | 'high';

export const energyLevelData: Record<EnergyLevel, { label: string; description: string; suggestedDuration: number }> = {
  veryLow: { label: 'Very low', description: 'Just a few minutes', suggestedDuration: 5 },
  low: { label: 'Low', description: '5-10 minutes max', suggestedDuration: 10 },
  medium: { label: 'Medium', description: '15-30 minutes', suggestedDuration: 20 },
  high: { label: 'High', description: "I'm ready for more", suggestedDuration: 45 },
};

export type AppTone = 'gentle' | 'practical' | 'playful';

export const appToneData: Record<AppTone, { label: string; description: string; emoji: string }> = {
  gentle: { label: 'Gentle', description: 'Soft encouragement, no pressure', emoji: '🌸' },
  practical: { label: 'Practical', description: 'Just tell me what to do', emoji: '📋' },
  playful: { label: 'Playful', description: 'Make it fun!', emoji: '✨' },
};

export type FloorCount = 'one' | 'two' | 'threeOrMore';

export const floorCountData: Record<FloorCount, { label: string; value: number }> = {
  one: { label: 'One floor', value: 1 },
  two: { label: 'Two floors', value: 2 },
  threeOrMore: { label: 'Three or more', value: 3 },
};

export type WindowAmount = 'few' | 'average' | 'lots';

export const windowAmountData: Record<WindowAmount, { label: string }> = {
  few: { label: 'A few' },
  average: { label: 'An average amount' },
  lots: { label: 'Lots of windows' },
};

export type HomeSize = 'small' | 'medium' | 'large';

export type NamedRoomType =
  | 'bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'livingRoom'
  | 'entryway'
  | 'petArea';

export interface NamedRoom {
  id: string;
  type: NamedRoomType;
  name: string;
  lastCleaned?: string; // ISO date string
  lastDeepCleaned?: string; // ISO date string
}

export const namedRoomIcons: Record<NamedRoomType, string> = {
  bedroom: 'bed-outline',
  bathroom: 'water-outline',
  kitchen: 'restaurant-outline',
  livingRoom: 'tv-outline',
  entryway: 'enter-outline',
  petArea: 'paw-outline',
};

export interface HomeConfig {
  bedrooms: number; // 0 = Studio
  bathrooms: number;
  floors: FloorCount;
  windowAmount: WindowAmount;
  hasPets: boolean;
  namedRooms?: NamedRoom[];
}

export interface UserProfile {
  hasCompletedOnboarding: boolean;

  // Emotional preferences
  feelingAboutSpace?: SpaceFeeling;
  mainStruggle?: CleaningStruggle;
  energyLevel?: EnergyLevel;
  preferredTone?: AppTone;

  // Home configuration
  homeConfig: HomeConfig;

  // Stats
  questsCompleted: number;
  totalMinutesCleaned: number;
  currentStreak: number;
  longestStreak: number;

  // Points System
  totalPoints: number;
  weeklyPoints: number;
  weeklyPointsResetDate?: string; // ISO date string

  // Community Access
  hasCommunityAccess: boolean;
  isCommunityAccessActive: boolean;
  communityUnlockDate?: string;

  // Authentication
  appleUserId?: string;
}

// MARK: - Points Config

export const PointsConfig = {
  communityUnlockThreshold: 300,
  weeklyMinimumForAccess: 100,

  getPoints: (category: QuestCategory, duration?: number): number => {
    switch (category) {
      case 'daily':
        return 100;
      case 'weekly':
        return 150;
      case 'monthly':
      case 'seasonal':
        return 250;
      case 'speedClean':
        // Scale by duration: 5min=100, 60min=200
        if (!duration) return 100;
        const scaledPoints = 100 + Math.floor(duration / 5) * 10;
        return Math.min(200, scaledPoints);
      case 'deepClean':
        return 300;
      case 'declutter':
        return 200;
      case 'laundry':
        return 150;
      case 'pet':
        return 150;
      default:
        return 100;
    }
  },
};

// MARK: - Default Values

export const defaultHomeConfig: HomeConfig = {
  bedrooms: 1,
  bathrooms: 1,
  floors: 'one',
  windowAmount: 'average',
  hasPets: false,
};

export const defaultUserProfile: UserProfile = {
  hasCompletedOnboarding: false,
  homeConfig: defaultHomeConfig,
  questsCompleted: 0,
  totalMinutesCleaned: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalPoints: 0,
  weeklyPoints: 0,
  hasCommunityAccess: false,
  isCommunityAccessActive: false,
};

// MARK: - Helpers

export function getHomeSize(config: HomeConfig): HomeSize {
  const isStudio = config.bedrooms === 0;
  if (isStudio || (config.bedrooms === 1 && config.bathrooms === 1)) {
    return 'small';
  } else if (config.bedrooms <= 2 && config.bathrooms <= 2) {
    return 'medium';
  } else {
    return 'large';
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Helper to generate default named rooms based on counts
export function generateDefaultNamedRooms(bedrooms: number, bathrooms: number, hasPets: boolean = false): NamedRoom[] {
  const rooms: NamedRoom[] = [];

  // Add common rooms first (kitchen, living room, entryway)
  rooms.push({
    id: generateId(),
    type: 'kitchen',
    name: 'Kitchen',
  });

  rooms.push({
    id: generateId(),
    type: 'livingRoom',
    name: 'Living Room',
  });

  rooms.push({
    id: generateId(),
    type: 'entryway',
    name: 'Entryway',
  });

  // Add bedrooms (skip if studio)
  for (let i = 1; i <= bedrooms; i++) {
    rooms.push({
      id: generateId(),
      type: 'bedroom',
      name: bedrooms === 1 ? 'Bedroom' : `Bedroom ${i}`,
    });
  }

  // Add bathrooms
  const fullBathrooms = Math.floor(bathrooms);
  const hasHalfBath = bathrooms % 1 !== 0;

  for (let i = 1; i <= fullBathrooms; i++) {
    rooms.push({
      id: generateId(),
      type: 'bathroom',
      name: fullBathrooms === 1 && !hasHalfBath ? 'Bathroom' : `Bathroom ${i}`,
    });
  }

  if (hasHalfBath) {
    rooms.push({
      id: generateId(),
      type: 'bathroom',
      name: 'Half Bath',
    });
  }

  // Add pet area if user has pets
  if (hasPets) {
    rooms.push({
      id: generateId(),
      type: 'petArea',
      name: 'Pet Area',
    });
  }

  return rooms;
}
