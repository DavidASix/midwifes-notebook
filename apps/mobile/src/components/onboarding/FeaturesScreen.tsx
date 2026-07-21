import { View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { makeStyles } from "@/lib/make-styles";
import { fontFamilies, fontSize, radius } from "@/lib/themes";

const FEATURES = [
  {
    title: "Keep client records organized",
    description: "Store the details you need in one private notebook.",
  },
  {
    title: "Use practical clinical tools",
    description: "Quickly calculate dates and gestational age.",
  },
  {
    title: "See your practice at a glance",
    description: "Review upcoming dates, history, and statistics.",
  },
] as const;

export function FeaturesScreen({ onContinue }: { onContinue: () => void }) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Everything in one place</Text>

        <View style={styles.list}>
          {FEATURES.map((feature, index) => (
            <View key={feature.title} style={styles.feature}>
              <View style={styles.number}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Button title="Continue" onPress={onContinue} />
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center" as const,
    paddingHorizontal: 24,
    paddingBottom: 72,
    gap: 32,
  },
  content: {
    gap: 28,
  },
  title: {
    color: theme.foreground,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize["3xl"],
    textAlign: "center" as const,
  },
  list: {
    gap: 12,
  },
  feature: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    padding: 16,
    borderRadius: radius["2xl"],
    backgroundColor: theme.card,
  },
  number: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: theme.accent,
  },
  numberText: {
    color: theme.accentForeground,
    fontFamily: fontFamilies.base.bold,
    fontSize: fontSize.sm,
  },
  featureCopy: {
    flex: 1,
    gap: 3,
  },
  featureTitle: {
    color: theme.foreground,
    fontFamily: fontFamilies.base.semiBold,
    fontSize: fontSize.md,
  },
  featureDescription: {
    color: theme.mutedForeground,
    fontFamily: fontFamilies.base.regular,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
}));
