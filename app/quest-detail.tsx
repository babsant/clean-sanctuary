/**
 * Quest Detail Screen
 * Step-by-step quest execution view.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { PrimaryButton, StepProgressBar, PointsBadge } from '@/components/ui';
import { useApp } from '@/context/AppContext';

export default function QuestDetailScreen() {
  const {
    activeQuest,
    currentQuestStep,
    advanceQuestStep,
    completeQuest,
    skipQuest,
  } = useApp();

  const [showCompletion, setShowCompletion] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation values
  const checkOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0.5);
  const textOpacity = useSharedValue(1);
  const contentSlide = useSharedValue(0);
  const [showStrikethrough, setShowStrikethrough] = useState(false);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: contentSlide.value }],
    opacity: 1 - Math.abs(contentSlide.value) / 100,
  }));

  // Redirect to home if no active quest (must be in useEffect, not during render)
  useEffect(() => {
    if (!activeQuest) {
      router.replace('/');
    }
  }, [activeQuest]);

  // Show loading state while redirecting
  if (!activeQuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionMessage}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const quest = activeQuest;
  const currentStep = quest.steps[currentQuestStep];
  const isLastStep = currentQuestStep >= quest.steps.length - 1;

  const handleNext = async () => {
    if (isAnimating) return;

    if (isLastStep) {
      // Celebration haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Complete the quest
      const points = await completeQuest();
      setEarnedPoints(points);
      setShowCompletion(true);

      // Extra celebration haptics
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 300);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 500);

      // Auto dismiss after celebration
      setTimeout(() => {
        router.replace('/');
      }, 3000);
    } else {
      setIsAnimating(true);

      // Subtle success haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // 1. Strike through the text
      setShowStrikethrough(true);

      // 2. Show checkmark
      setTimeout(() => {
        checkOpacity.value = withSpring(1, { damping: 12 });
        checkScale.value = withSpring(1, { damping: 10, stiffness: 200 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 150);

      // 3. Fade and slide out
      setTimeout(() => {
        textOpacity.value = withTiming(0.3, { duration: 200 });
        contentSlide.value = withTiming(-30, { duration: 250 });
      }, 500);

      // 4. Advance to next step
      setTimeout(() => {
        advanceQuestStep();

        // Reset animation values
        setShowStrikethrough(false);
        checkOpacity.value = 0;
        checkScale.value = 0.5;
        textOpacity.value = 1;
        contentSlide.value = 0;

        setIsAnimating(false);
      }, 750);
    }
  };

  const handleSkipStep = () => {
    Haptics.selectionAsync();
    if (isLastStep) {
      handleNext();
    } else {
      advanceQuestStep();
    }
  };

  const handleExit = () => {
    skipQuest();
    router.replace('/');
  };

  if (showCompletion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completionContainer}>
          {/* Main celebration content */}
          <Animated.View
            entering={ZoomIn.springify().damping(12)}
            style={styles.checkmarkContainer}
          >
            <Ionicons
              name="checkmark-circle"
              size={80}
              color={Colors.accent}
            />
          </Animated.View>

          <Animated.Text
            entering={FadeIn.delay(200).duration(400)}
            style={styles.completionTitle}
          >
            Quest Complete
          </Animated.Text>

          <Animated.View entering={FadeIn.delay(400).duration(400)}>
            <PointsBadge points={earnedPoints} size="large" />
          </Animated.View>

          <Animated.Text
            entering={FadeIn.delay(600).duration(400)}
            style={styles.completionMessage}
          >
            Great job taking care of your space
          </Animated.Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.questTitle} numberOfLines={1}>
            {quest.title}
          </Text>
        </View>
        <Pressable onPress={handleExit} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <StepProgressBar
          total={quest.steps.length}
          current={currentQuestStep + 1}
        />
        <Text style={styles.stepIndicator}>
          Step {currentQuestStep + 1} of {quest.steps.length}
        </Text>
      </View>

      {/* Current Step */}
      <View style={styles.stepContent}>
        <Animated.View style={[styles.stepInner, contentAnimatedStyle]}>
          {/* Instruction with strikethrough */}
          <View style={styles.instructionContainer}>
            <Animated.Text
              style={[
                styles.instruction,
                textAnimatedStyle,
                showStrikethrough && styles.instructionStrikethrough,
              ]}
            >
              {currentStep.instruction}
            </Animated.Text>
          </View>

          {/* Checkmark that appears */}
          <Animated.View style={[styles.inlineCheck, checkAnimatedStyle]}>
            <Ionicons name="checkmark-circle" size={36} color={Colors.accent} />
          </Animated.View>

          {currentStep.explanation && !showStrikethrough && (
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationLabel}>WHY THIS HELPS</Text>
              <Text style={styles.explanation}>{currentStep.explanation}</Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <PrimaryButton
          title={isLastStep ? 'Complete Quest' : 'Done, Next Step'}
          onPress={handleNext}
        />

        <View style={styles.secondaryActions}>
          <Pressable onPress={handleSkipStep}>
            <Text style={styles.secondaryActionText}>Skip Step</Text>
          </Pressable>
          <Text style={styles.actionDivider}>•</Text>
          <Pressable onPress={handleExit}>
            <Text style={styles.secondaryActionText}>Exit Quest</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  headerLeft: {
    flex: 1,
  },
  questTitle: {
    ...Typography.headline,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  progressSection: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.md,
  },
  stepIndicator: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
  },
  stepInner: {
    alignItems: 'center',
    width: '100%',
  },
  instructionContainer: {
    alignItems: 'center',
  },
  inlineCheck: {
    marginTop: Spacing.lg,
  },
  instruction: {
    ...Typography.title,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  instructionStrikethrough: {
    textDecorationLine: 'line-through',
    textDecorationColor: Colors.accent,
    color: Colors.textTertiary,
  },
  explanationContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  explanationLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  explanation: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  secondaryActionText: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
  },
  actionDivider: {
    color: Colors.textTertiary,
  },
  // Completion styles
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.screenHorizontal,
  },
  checkmarkContainer: {
    marginBottom: Spacing.sm,
  },
  completionTitle: {
    ...Typography.title,
    color: Colors.text,
  },
  completionMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
