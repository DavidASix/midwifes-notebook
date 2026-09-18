import type { ReactNode } from "react";
import { View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { makeStyles } from "@/lib/make-styles";
import { fontFamilies, fontSize } from "@/lib/themes";

type StateViewProps = {
  title?: string;
  message: string;
  action?: () => void;
  actionLabel?: string;
  children?: ReactNode;
};

/** Renders a centered loading, failure, or missing-record state for record edit screens. */
export function StateView({
  title,
  message,
  action,
  actionLabel,
  children,
}: StateViewProps) {
  const styles = useStyles();
  return (
    <View style={styles.centeredState}>
      {children}
      {title && (
        <Text header style={styles.stateTitle}>
          {title}
        </Text>
      )}
      <Text style={styles.stateText}>{message}</Text>
      {action && actionLabel && <Button onPress={action} title={actionLabel} />}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  centeredState: {
    flex: 1,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateTitle: {
    color: theme.primary,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize["2xl"],
    textAlign: "center",
  },
  stateText: {
    maxWidth: 300,
    color: theme.mutedForeground,
    fontSize: fontSize.md,
    lineHeight: 22,
    textAlign: "center",
  },
}));
