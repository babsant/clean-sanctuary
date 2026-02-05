/**
 * Community Service
 * Handles InstantDB integration for the Community Bonfire feature.
 */

import { init, tx, id } from '@instantdb/react-native';
import { schema } from '@/instant.schema';

// Initialize InstantDB - Replace with your actual app ID
const APP_ID = process.env.EXPO_PUBLIC_INSTANT_APP_ID || 'YOUR_INSTANT_APP_ID';

export const db = init({
  appId: APP_ID,
  schema,
});

// Points required to move fire warmth 1%
// 100 points = 1% warmth (so a single quest makes visible progress)
const POINTS_PER_PERCENT = 100;

// Decay settings
const DECAY_RATE_PER_HOUR = 0.5; // Rock falls 0.5% per hour
const GRACE_PERIOD_HOURS = 4; // No decay for first 4 hours

/**
 * Community data types
 */
export interface CommunityRock {
  id: string;
  position: number;
  totalContributed: number;
  lastUpdated: number;
  decayRate: number;
}

export interface CommunityUser {
  id: string;
  oderId: string;
  totalPoints: number;
  lastContributionDate: number;
}

export interface Contribution {
  id: string;
  oderId: string;
  amount: number;
  contributedAt: number;
}

/**
 * Contribute points to the community rock
 */
export async function contributePoints(userId: string, amount: number): Promise<void> {
  const now = Date.now();
  const percentIncrease = amount / POINTS_PER_PERCENT;

  // Get current rock state and check if user exists
  const { data } = await db.queryOnce({
    communityRock: {},
    users: {
      $: {
        where: { oderId: userId },
      },
    },
  });

  const currentRock = data?.communityRock?.[0];
  const currentPosition = currentRock?.position || 0;
  const currentTotal = currentRock?.totalContributed || 0;
  const existingUser = data?.users?.[0];

  const newPosition = Math.min(100, currentPosition + percentIncrease);

  // Build transaction
  const transactions = [
    // Create contribution record
    tx.contributions[id()].update({
      oderId: userId,
      amount,
      contributedAt: now,
    }),

    // Update or create rock
    currentRock
      ? tx.communityRock[currentRock.id].update({
          position: newPosition,
          totalContributed: currentTotal + amount,
          lastUpdated: now,
        })
      : tx.communityRock[id()].update({
          position: newPosition,
          totalContributed: amount,
          lastUpdated: now,
          decayRate: DECAY_RATE_PER_HOUR,
        }),
  ];

  // Update existing user or create new one
  if (existingUser) {
    transactions.push(
      tx.users[existingUser.id].update({
        totalPoints: (existingUser.totalPoints || 0) + amount,
        lastContributionDate: now,
      })
    );
  } else {
    transactions.push(
      tx.users[id()].update({
        oderId: userId,
        totalPoints: amount,
        lastContributionDate: now,
      })
    );
  }

  // Perform transaction
  await db.transact(transactions);
}

/**
 * Calculate decayed position based on time since last activity
 */
export function calculateDecayedPosition(
  currentPosition: number,
  lastUpdated: number,
  decayRate: number = DECAY_RATE_PER_HOUR,
  gracePeriodHours: number = GRACE_PERIOD_HOURS
): number {
  const now = Date.now();
  const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);

  if (hoursSinceUpdate <= gracePeriodHours) {
    return currentPosition;
  }

  const decayHours = hoursSinceUpdate - gracePeriodHours;
  const decayAmount = decayHours * decayRate;

  return Math.max(0, currentPosition - decayAmount);
}

/**
 * Get bonfire message based on current warmth level
 */
export function getBonfireMessage(position: number): string {
  if (position >= 90) {
    return "The fire is roaring! Everyone's warm and cozy!";
  } else if (position >= 70) {
    return "A beautiful blaze! The warmth brings us together.";
  } else if (position >= 50) {
    return "The flames are growing strong!";
  } else if (position >= 30) {
    return "A steady fire. More hands make it brighter.";
  } else if (position >= 10) {
    return "Sparks are catching. Keep adding fuel!";
  } else {
    return "A small flame flickers. Let's build it together.";
  }
}

/**
 * Get the number of people to show around the bonfire based on contributors
 */
export function getPeopleCount(contributors: number, position: number): number {
  // Show people based on both contributor count and fire strength
  // Min 1 person if there's any activity, max 8 people
  if (position === 0 && contributors === 0) return 0;

  const baseCount = Math.min(contributors, 4);
  const bonusFromFire = position >= 50 ? 2 : position >= 25 ? 1 : 0;

  return Math.min(8, Math.max(1, baseCount + bonusFromFire));
}

/**
 * Get fire size category based on position
 */
export function getFireSize(position: number): 'ember' | 'small' | 'medium' | 'large' | 'roaring' {
  if (position >= 80) return 'roaring';
  if (position >= 60) return 'large';
  if (position >= 35) return 'medium';
  if (position >= 10) return 'small';
  return 'ember';
}

/**
 * Hook to subscribe to community rock data
 */
export function useCommunityRock() {
  return db.useQuery({
    communityRock: {},
    users: {},
  });
}

/**
 * Hook to get recent contributions
 */
export function useRecentContributions(limit: number = 10) {
  return db.useQuery({
    contributions: {
      $: {
        limit,
        order: { serverCreatedAt: 'desc' },
      },
    },
  });
}
