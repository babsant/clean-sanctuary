/**
 * Onboarding Flow Screen
 * Multi-step onboarding to collect user preferences.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';
import {
  PrimaryButton,
  SelectionButton,
  ProgressDots,
  StepperControl,
} from '@/components/ui';
import { useApp } from '@/context/AppContext';
import {
  SpaceFeeling,
  CleaningStruggle,
  EnergyLevel,
  AppTone,
  FloorCount,
  WindowAmount,
  spaceFeelingData,
  cleaningStruggleData,
  energyLevelData,
  appToneData,
  floorCountData,
  windowAmountData,
  HomeConfig,
  defaultHomeConfig,
  generateDefaultNamedRooms,
} from '@/models/types';

type OnboardingStep =
  | 'welcome'
  | 'feeling'
  | 'struggle'
  | 'energy'
  | 'tone'
  | 'bedrooms'
  | 'bathrooms'
  | 'floors'
  | 'windows'
  | 'ready';

const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'feeling',
  'struggle',
  'energy',
  'tone',
  'bedrooms',
  'bathrooms',
  'floors',
  'windows',
  'ready',
];

export default function OnboardingScreen() {
  const { updateProfile, completeOnboarding } = useApp();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [feeling, setFeeling] = useState<SpaceFeeling | null>(null);
  const [struggle, setStruggle] = useState<CleaningStruggle | null>(null);
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [tone, setTone] = useState<AppTone | null>(null);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(defaultHomeConfig);

  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const totalSteps = STEP_ORDER.length - 2; // Exclude welcome and ready

  const advance = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      // Skip floors if small home
      if (STEP_ORDER[nextIndex] === 'floors' && homeConfig.bedrooms <= 2) {
        setCurrentStep(STEP_ORDER[nextIndex + 1]);
      } else {
        setCurrentStep(STEP_ORDER[nextIndex]);
      }
    }
  };

  const skip = () => {
    advance();
  };

  const finish = async () => {
    const finalConfig = {
      ...homeConfig,
      namedRooms: generateDefaultNamedRooms(homeConfig.bedrooms, homeConfig.bathrooms, homeConfig.hasPets),
    };
    await updateProfile({
      feelingAboutSpace: feeling || undefined,
      mainStruggle: struggle || undefined,
      energyLevel: energy || undefined,
      preferredTone: tone || undefined,
      homeConfig: finalConfig,
    });
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onContinue={advance} />;
      case 'feeling':
        return (
          <FeelingStep
            selection={feeling}
            onSelect={setFeeling}
            onContinue={advance}
          />
        );
      case 'struggle':
        return (
          <StruggleStep
            selection={struggle}
            onSelect={setStruggle}
            onContinue={advance}
          />
        );
      case 'energy':
        return (
          <EnergyStep
            selection={energy}
            onSelect={setEnergy}
            onContinue={advance}
          />
        );
      case 'tone':
        return (
          <ToneStep
            selection={tone}
            onSelect={setTone}
            onContinue={advance}
          />
        );
      case 'bedrooms':
        return (
          <BedroomsStep
            value={homeConfig.bedrooms}
            onChange={(v) => setHomeConfig({ ...homeConfig, bedrooms: v })}
            onContinue={advance}
            onSkip={skip}
          />
        );
      case 'bathrooms':
        return (
          <BathroomsStep
            value={homeConfig.bathrooms}
            onChange={(v) => setHomeConfig({ ...homeConfig, bathrooms: v })}
            onContinue={advance}
            onSkip={skip}
          />
        );
      case 'floors':
        return (
          <FloorsStep
            selection={homeConfig.floors}
            onSelect={(v) => setHomeConfig({ ...homeConfig, floors: v })}
            onContinue={advance}
            onSkip={skip}
          />
        );
      case 'windows':
        return (
          <WindowsStep
            selection={homeConfig.windowAmount}
            onSelect={(v) => setHomeConfig({ ...homeConfig, windowAmount: v })}
            onContinue={advance}
            onSkip={skip}
          />
        );
      case 'ready':
        return <ReadyStep onStart={finish} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Progress Indicator */}
        {currentStep !== 'welcome' && currentStep !== 'ready' && (
          <View style={styles.progress}>
            <ProgressDots total={totalSteps} current={stepIndex - 1} />
          </View>
        )}

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// MARK: - Step Components

interface WelcomeStepProps {
  onContinue: () => void;
}

function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.centerContent}>
        <Ionicons name="sparkles" size={60} color={Colors.accent} />
        <Text style={styles.welcomeTitle}>Welcome</Text>
        <Text style={styles.welcomeSubtitle}>
          Let's make cleaning feel manageable.{'\n'}No pressure, no judgment.
        </Text>
      </View>
      <PrimaryButton title="Let's Begin" onPress={onContinue} />
    </View>
  );
}

interface FeelingStepProps {
  selection: SpaceFeeling | null;
  onSelect: (feeling: SpaceFeeling) => void;
  onContinue: () => void;
}

function FeelingStep({ selection, onSelect, onContinue }: FeelingStepProps) {
  const feelings = Object.entries(spaceFeelingData) as [SpaceFeeling, typeof spaceFeelingData.overwhelmed][];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        How do you feel{'\n'}about your space right now?
      </Text>

      <View style={styles.options}>
        {feelings.map(([key, data]) => (
          <SelectionButton
            key={key}
            title={`${data.emoji} ${data.label}`}
            subtitle={data.description}
            isSelected={selection === key}
            onPress={() => onSelect(key)}
          />
        ))}
      </View>

      <PrimaryButton
        title="Continue"
        onPress={onContinue}
        disabled={!selection}
      />
    </View>
  );
}

interface StruggleStepProps {
  selection: CleaningStruggle | null;
  onSelect: (struggle: CleaningStruggle) => void;
  onContinue: () => void;
}

function StruggleStep({ selection, onSelect, onContinue }: StruggleStepProps) {
  const struggles = Object.entries(cleaningStruggleData) as [CleaningStruggle, typeof cleaningStruggleData.starting][];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        What do you struggle{'\n'}with most?
      </Text>

      <View style={styles.options}>
        {struggles.map(([key, data]) => (
          <SelectionButton
            key={key}
            title={data.label}
            subtitle={data.description}
            isSelected={selection === key}
            onPress={() => onSelect(key)}
          />
        ))}
      </View>

      <PrimaryButton
        title="Continue"
        onPress={onContinue}
        disabled={!selection}
      />
    </View>
  );
}

interface EnergyStepProps {
  selection: EnergyLevel | null;
  onSelect: (energy: EnergyLevel) => void;
  onContinue: () => void;
}

function EnergyStep({ selection, onSelect, onContinue }: EnergyStepProps) {
  const levels = Object.entries(energyLevelData) as [EnergyLevel, typeof energyLevelData.veryLow][];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        How much energy do you{'\n'}have for cleaning?
      </Text>

      <View style={styles.options}>
        {levels.map(([key, data]) => (
          <SelectionButton
            key={key}
            title={data.label}
            subtitle={data.description}
            isSelected={selection === key}
            onPress={() => onSelect(key)}
          />
        ))}
      </View>

      <PrimaryButton
        title="Continue"
        onPress={onContinue}
        disabled={!selection}
      />
    </View>
  );
}

interface ToneStepProps {
  selection: AppTone | null;
  onSelect: (tone: AppTone) => void;
  onContinue: () => void;
}

function ToneStep({ selection, onSelect, onContinue }: ToneStepProps) {
  const tones = Object.entries(appToneData) as [AppTone, typeof appToneData.gentle][];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        How would you like me{'\n'}to talk to you?
      </Text>

      <View style={styles.options}>
        {tones.map(([key, data]) => (
          <SelectionButton
            key={key}
            title={`${data.emoji} ${data.label}`}
            subtitle={data.description}
            isSelected={selection === key}
            onPress={() => onSelect(key)}
          />
        ))}
      </View>

      <PrimaryButton
        title="Continue"
        onPress={onContinue}
        disabled={!selection}
      />
    </View>
  );
}

interface BedroomsStepProps {
  value: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onSkip: () => void;
}

function BedroomsStep({ value, onChange, onContinue, onSkip }: BedroomsStepProps) {
  return (
    <View style={styles.stepContainer}>
      <View>
        <Text style={styles.stepTitle}>How many bedrooms?</Text>
        <Text style={styles.stepSubtitle}>This helps pace your quests.</Text>
      </View>

      <View style={styles.centerContent}>
        <StepperControl
          value={value}
          onChange={onChange}
          min={0}
          max={10}
          label={value === 0 ? 'Studio' : undefined}
        />
      </View>

      <View style={styles.buttonGroup}>
        <PrimaryButton title="Continue" onPress={onContinue} />
        <PrimaryButton title="Skip" onPress={onSkip} style="ghost" />
      </View>
    </View>
  );
}

interface BathroomsStepProps {
  value: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onSkip: () => void;
}

function BathroomsStep({ value, onChange, onContinue, onSkip }: BathroomsStepProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How many bathrooms?</Text>

      <View style={styles.centerContent}>
        <StepperControl value={value} onChange={onChange} min={1} max={5} />
      </View>

      <View style={styles.buttonGroup}>
        <PrimaryButton title="Continue" onPress={onContinue} />
        <PrimaryButton title="Skip" onPress={onSkip} style="ghost" />
      </View>
    </View>
  );
}

interface FloorsStepProps {
  selection: FloorCount;
  onSelect: (floors: FloorCount) => void;
  onContinue: () => void;
  onSkip: () => void;
}

function FloorsStep({ selection, onSelect, onContinue, onSkip }: FloorsStepProps) {
  const floors = Object.entries(floorCountData) as [FloorCount, typeof floorCountData.one][];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How many floors?</Text>

      <View style={styles.options}>
        {floors.map(([key, data]) => (
          <SelectionButton
            key={key}
            title={data.label}
            isSelected={selection === key}
            onPress={() => onSelect(key)}
          />
        ))}
      </View>

      <View style={styles.buttonGroup}>
        <PrimaryButton title="Continue" onPress={onContinue} />
        <PrimaryButton title="Skip" onPress={onSkip} style="ghost" />
      </View>
    </View>
  );
}

interface WindowsStepProps {
  selection: WindowAmount;
  onSelect: (windows: WindowAmount) => void;
  onContinue: () => void;
  onSkip: () => void;
}

function WindowsStep({ selection, onSelect, onContinue, onSkip }: WindowsStepProps) {
  const windows = Object.entries(windowAmountData) as [WindowAmount, typeof windowAmountData.few][];

  return (
    <View style={styles.stepContainer}>
      <View>
        <Text style={styles.stepTitle}>How many windows?</Text>
        <Text style={styles.stepSubtitle}>Used for occasional deep-clean quests.</Text>
      </View>

      <View style={styles.options}>
        {windows.map(([key, data]) => (
          <SelectionButton
            key={key}
            title={data.label}
            isSelected={selection === key}
            onPress={() => onSelect(key)}
          />
        ))}
      </View>

      <View style={styles.buttonGroup}>
        <PrimaryButton title="Continue" onPress={onContinue} />
        <PrimaryButton title="Skip" onPress={onSkip} style="ghost" />
      </View>
    </View>
  );
}

interface ReadyStepProps {
  onStart: () => void;
}

function ReadyStep({ onStart }: ReadyStepProps) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.centerContent}>
        <Ionicons name="checkmark-circle" size={80} color={Colors.accent} />
        <Text style={styles.welcomeTitle}>You're all set!</Text>
        <Text style={styles.welcomeSubtitle}>
          Let's start with something small.{'\n'}Remember: any progress is good progress.
        </Text>
      </View>
      <PrimaryButton title="Start Cleaning" onPress={onStart} />
    </View>
  );
}

// MARK: - Styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  progress: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.screenHorizontal,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.xl,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  welcomeTitle: {
    ...Typography.largeTitle,
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  welcomeSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepTitle: {
    ...Typography.title2,
    color: Colors.text,
    textAlign: 'center',
  },
  stepSubtitle: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  options: {
    gap: Spacing.sm,
    marginVertical: Spacing.xl,
  },
  buttonGroup: {
    gap: Spacing.sm,
  },
});
