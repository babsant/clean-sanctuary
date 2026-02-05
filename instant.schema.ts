/**
 * InstantDB Schema for ADHD Cleaning App
 * Defines the data structure for community features.
 */

import { i } from '@instantdb/react-native';

const _schema = i.schema({
  entities: {
    // Community Rock - The collective boulder-pushing progress
    communityRock: i.entity({
      position: i.number(), // 0-100 representing % up the hill
      totalContributed: i.number(), // Total points contributed
      lastUpdated: i.number(), // Timestamp in ms
      decayRate: i.number(), // % decay per hour when inactive
    }),

    // Users who participate in community
    users: i.entity({
      oderId: i.string().indexed(), // Anonymous user ID (from auth)
      totalPoints: i.number(),
      lastContributionDate: i.number(), // Timestamp in ms
    }),

    // Individual contribution records
    contributions: i.entity({
      oderId: i.string().indexed(), // User ID who contributed
      amount: i.number(), // Points contributed
      contributedAt: i.number(), // Timestamp in ms
    }),
  },
});

// Export the schema type for use with init()
type _AppSchema = typeof _schema;
export interface AppSchema extends _AppSchema {}
export const schema: AppSchema = _schema;

// Default export for CLI
export default _schema;
