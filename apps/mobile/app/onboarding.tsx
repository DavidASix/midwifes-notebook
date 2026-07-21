import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeaturesScreen } from "@/components/onboarding/FeaturesScreen";
import { LockSelectionScreen } from "@/components/onboarding/LockSelectionScreen";
import { WelcomeScreen } from "@/components/onboarding/WelcomeScreen";
import { makeStyles } from "@/lib/make-styles";

const ONBOARDING_COMPLETE_KEY = "onboardingComplete";

type OnboardingStep = {
  key: string;
  content: React.ReactNode;
};

/**
 * Coordinates onboarding navigation and persistence while each individual step
 * remains an independently editable component.
 */
export default function OnboardingScreen() {
  const [onboardingComplete, setOnboardingComplete] = useState<
    boolean | undefined
  >(undefined);
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  useEffect(() => {
    const init = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        setOnboardingComplete(value === "complete");
      } catch (error) {
        console.error("Failed to read onboarding status", error);
        setOnboardingComplete(false);
      }
    };

    init();
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      scrollRef.current?.scrollTo({ x: index * width, animated: true });
      setCurrentStep(index);
    },
    [width],
  );

  const goToNextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "complete");
    router.replace("lock");
  }, []);

  /**
   * Ordered onboarding registry. To add a screen, create its component beside
   * the existing onboarding screens, import it, and insert one entry here.
   */
  const steps: OnboardingStep[] = [
    {
      key: "welcome",
      content: <WelcomeScreen onContinue={goToNextStep} />,
    },
    {
      key: "features",
      content: <FeaturesScreen onContinue={goToNextStep} />,
    },
    {
      key: "lock-selection",
      content: <LockSelectionScreen onContinue={completeOnboarding} />,
    },
  ];

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrentStep(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  if (onboardingComplete === undefined) return null;
  if (onboardingComplete) return <Redirect href="/lock" />;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroller}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {steps.map((step) => (
          <View key={step.key} style={[styles.page, { width }]}>
            {step.content}
          </View>
        ))}
      </ScrollView>

      <View
        style={[styles.pagination, { bottom: insets.bottom + 24 }]}
        accessibilityLabel="Onboarding progress"
      >
        {steps.map((step, index) => (
          <View
            key={step.key}
            style={[styles.dot, index === currentStep && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  page: {
    flex: 1,
  },
  scroller: {
    flex: 1,
  },
  pagination: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.border,
  },
  activeDot: {
    width: 24,
    backgroundColor: theme.primary,
  },
}));
