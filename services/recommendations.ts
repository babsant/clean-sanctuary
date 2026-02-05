/**
 * Quest Recommendation Engine
 * Intelligently recommends quests based on user profile and context.
 */

import { Quest, UserProfile, getHomeSize } from '@/models/types';
import { allQuests, getQuestsByMaxDuration } from '@/data/quests';
import { CompletedQuests, storageService } from './storage';

class QuestRecommendationEngine {
  // MARK: - Main Recommendation

  getRecommendedQuest(
    profile: UserProfile,
    completedQuests: CompletedQuests
  ): Quest | null {
    return this.getRecommendedQuestWithContext(profile, completedQuests).quest;
  }

  getRecommendedQuestWithContext(
    profile: UserProfile,
    completedQuests: CompletedQuests
  ): { quest: Quest | null; isCatchUp: boolean; todayComplete: boolean } {
    const completedToday = this.getCompletedQuestIdsToday(completedQuests);
    const dayOfWeek = new Date().getDay();

    // Get today's ideal quests (daily routines, day-specific weekly tasks)
    const todaysQuests = allQuests.filter(q => {
      // Daily routines are always relevant
      if (q.category === 'daily') return true;

      // Weekly tasks for specific days
      if (q.category === 'weekly') {
        if (dayOfWeek === 1 && q.title.includes('Monday')) return true;
        if (dayOfWeek === 2 && q.title.includes('Tuesday')) return true;
        if (dayOfWeek === 3 && q.title.includes('Wednesday')) return true;
        if (dayOfWeek === 4 && q.title.includes('Thursday')) return true;
        if (dayOfWeek === 5 && q.title.includes('Friday')) return true;
      }

      return false;
    });

    // Check if all of today's quests are done
    const uncompletedTodayQuests = todaysQuests.filter(q => !completedToday.has(q.id));
    const todayComplete = uncompletedTodayQuests.length === 0 && completedToday.size > 0;

    if (uncompletedTodayQuests.length > 0) {
      // There are still today's quests to do
      const scoredQuests = uncompletedTodayQuests
        .map(quest => ({
          quest,
          score: this.calculateScore(quest, profile),
        }))
        .sort((a, b) => b.score - a.score);

      return { quest: scoredQuests[0]?.quest || null, isCatchUp: false, todayComplete: false };
    }

    // All today's quests done! Suggest catch-up from this week
    const missedWeeklyQuests = allQuests.filter(q => {
      if (q.category !== 'weekly') return false;
      if (completedToday.has(q.id)) return false;

      // Check if this is from earlier in the week
      if (dayOfWeek > 1 && q.title.includes('Monday')) return true;
      if (dayOfWeek > 2 && q.title.includes('Tuesday')) return true;
      if (dayOfWeek > 3 && q.title.includes('Wednesday')) return true;
      if (dayOfWeek > 4 && q.title.includes('Thursday')) return true;

      return false;
    });

    if (missedWeeklyQuests.length > 0) {
      const randomMissed = missedWeeklyQuests[Math.floor(Math.random() * missedWeeklyQuests.length)];
      return { quest: randomMissed, isCatchUp: true, todayComplete };
    }

    // No missed quests, suggest speed clean or other
    const availableQuests = allQuests.filter(q => !completedToday.has(q.id));
    if (availableQuests.length === 0) {
      return { quest: allQuests[Math.floor(Math.random() * allQuests.length)], isCatchUp: false, todayComplete };
    }

    const scoredQuests = availableQuests
      .map(quest => ({
        quest,
        score: this.calculateScore(quest, profile),
      }))
      .sort((a, b) => b.score - a.score);

    return { quest: scoredQuests[0]?.quest || null, isCatchUp: false, todayComplete };
  }

  // MARK: - Quick Win Recommendation

  getQuickWinQuest(
    profile: UserProfile,
    completedQuests: CompletedQuests
  ): Quest | null {
    const completedToday = this.getCompletedQuestIdsToday(completedQuests);

    // Quick win should be 10 min or less for a true "quick" option
    const quickQuests = getQuestsByMaxDuration(10).filter(
      q => !completedToday.has(q.id)
    );

    // Prefer the shortest speed clean quests (5 min)
    const fiveMinQuests = quickQuests.filter(q => q.duration <= 5);
    if (fiveMinQuests.length > 0) {
      return fiveMinQuests[Math.floor(Math.random() * fiveMinQuests.length)];
    }

    // Then any 10 min or less speed clean
    const speedClean = quickQuests.filter(q => q.category === 'speedClean');
    if (speedClean.length > 0) {
      return speedClean[Math.floor(Math.random() * speedClean.length)];
    }

    // Fall back to any short quest
    return quickQuests[Math.floor(Math.random() * quickQuests.length)] || null;
  }

  // MARK: - Easiest Quest (for "I don't know where to start")

  getEasiestQuest(completedQuests: CompletedQuests): Quest | null {
    const completedToday = this.getCompletedQuestIdsToday(completedQuests);

    // Get very short quests (5 min or less) that haven't been done today
    const easyQuests = allQuests
      .filter(q => !completedToday.has(q.id))
      .filter(q => q.duration <= 5)
      .filter(q => q.category === 'speedClean' || q.category === 'daily');

    if (easyQuests.length > 0) {
      // Pick a random one to keep it fresh
      return easyQuests[Math.floor(Math.random() * easyQuests.length)];
    }

    // Fallback to any short quest (10 min or less)
    const shortQuests = allQuests
      .filter(q => !completedToday.has(q.id))
      .filter(q => q.duration <= 10);

    if (shortQuests.length > 0) {
      return shortQuests[Math.floor(Math.random() * shortQuests.length)];
    }

    // Final fallback - any quest
    const anyQuest = allQuests.filter(q => !completedToday.has(q.id));
    return anyQuest[Math.floor(Math.random() * anyQuest.length)] || null;
  }

  // MARK: - Ad-Hoc Mode

  getAdHocQuest(room: Quest['room'] | null, duration: number): Quest | null {
    let candidates = getQuestsByMaxDuration(duration);

    if (room) {
      candidates = candidates.filter(q => q.room === room);
    }

    // Prefer speed clean or daily tasks for ad-hoc
    const preferred = candidates.filter(
      q => q.category === 'speedClean' || q.category === 'daily'
    );

    if (preferred.length > 0) {
      return preferred[Math.floor(Math.random() * preferred.length)];
    }

    return candidates[Math.floor(Math.random() * candidates.length)] || null;
  }

  // MARK: - Scoring

  private calculateScore(quest: Quest, profile: UserProfile): number {
    let score = 0;
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday

    // Time of day preferences
    if (hour < 12 && quest.title.toLowerCase().includes('morning')) {
      score += 20;
    } else if (hour >= 17 && quest.title.toLowerCase().includes('night')) {
      score += 20;
    }

    // Energy level match
    if (profile.energyLevel) {
      const suggestedMax = this.getSuggestedDuration(profile.energyLevel);
      if (quest.duration <= suggestedMax) {
        score += 15;
      } else if (quest.duration <= suggestedMax * 2) {
        score += 5;
      }
    }

    // Home size considerations
    const homeSize = getHomeSize(profile.homeConfig);
    switch (homeSize) {
      case 'small':
        if (quest.category === 'speedClean') score += 10;
        break;
      case 'medium':
        if (quest.category === 'daily') score += 10;
        break;
      case 'large':
        if (quest.room) score += 10; // Room-specific for large homes
        break;
    }

    // Day of week for weekly tasks
    if (quest.frequency === 'weekly') {
      // Boost weekly tasks on weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        score += 10;
      }
    }

    // Struggle-based adjustments
    if (profile.mainStruggle) {
      switch (profile.mainStruggle) {
        case 'starting':
          // Short quests with few steps
          if (quest.steps.length <= 5) score += 15;
          break;
        case 'finishing':
          // Very short quests
          if (quest.duration <= 10) score += 15;
          break;
        case 'deciding':
          // Any quest is good - they need decisions made for them
          score += 10;
          break;
      }
    }

    return score;
  }

  // MARK: - Helpers

  private getCompletedQuestIdsToday(completedQuests: CompletedQuests): Set<string> {
    const todayIds = new Set<string>();

    for (const [questId, dateStr] of Object.entries(completedQuests)) {
      if (storageService.isQuestCompletedToday(questId, completedQuests)) {
        todayIds.add(questId);
      }
    }

    return todayIds;
  }

  private getSuggestedDuration(energyLevel: UserProfile['energyLevel']): number {
    switch (energyLevel) {
      case 'veryLow':
        return 5;
      case 'low':
        return 10;
      case 'medium':
        return 20;
      case 'high':
        return 45;
      default:
        return 15;
    }
  }
}

export const recommendationEngine = new QuestRecommendationEngine();
