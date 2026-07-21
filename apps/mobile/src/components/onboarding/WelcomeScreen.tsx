import { View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { makeStyles } from "@/lib/make-styles";
import { fontFamilies, fontSize } from "@/lib/themes";

export function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.description}>
          A simple, private notebook for your midwifery practice.
        </Text>
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
    gap: 40,
  },
  content: {
    alignItems: "center" as const,
    gap: 12,
  },
  title: {
    color: theme.foreground,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize["4xl"],
    textAlign: "center" as const,
  },
  description: {
    color: theme.mutedForeground,
    fontFamily: fontFamilies.base.regular,
    fontSize: fontSize.lg,
    lineHeight: 26,
    textAlign: "center" as const,
  },
}));
