import { View } from "react-native";
import {
  CircleAlert,
  CircleCheck,
  Info,
  type LucideIcon,
} from "lucide-react-native";
import Toast, {
  type ToastConfig,
  type ToastConfigParams,
} from "react-native-toast-message";

import { makeStyles } from "@/lib/make-styles";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize, radius } from "@/lib/themes";

import { Text } from "@/components/ui/Text";

type ToastKind = "success" | "error" | "info";

type ToastCardProps = Pick<ToastConfigParams<unknown>, "text1" | "text2"> & {
  icon: LucideIcon;
  kind: ToastKind;
};

function ToastCard({ icon: Icon, kind, text1, text2 }: ToastCardProps) {
  const styles = useStyles();
  const theme = useTheme();
  const color = kind === "error" ? theme.destructive : theme.primary;

  return (
    <View accessibilityRole="alert" style={styles.card}>
      <View style={[styles.icon, { backgroundColor: theme.accent }]}>
        <Icon color={color} size={20} strokeWidth={2.2} />
      </View>
      <View style={styles.copy}>
        {text1 && <Text style={styles.title}>{text1}</Text>}
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  );
}

const toastConfig: ToastConfig = {
  success: (props) => (
    <ToastCard {...props} icon={CircleCheck} kind="success" />
  ),
  error: (props) => <ToastCard {...props} icon={CircleAlert} kind="error" />,
  info: (props) => <ToastCard {...props} icon={Info} kind="info" />,
};

/** Hosts the app-wide, themed toast presenter above navigation content. */
export function AppToast() {
  return (
    <Toast
      bottomOffset={96}
      config={toastConfig}
      keyboardOffset={16}
      position="bottom"
      visibilityTime={6000}
    />
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    width: "92%",
    maxWidth: 520,
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius["2xl"],
    backgroundColor: theme.card,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 7,
  },
  icon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.xl,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: theme.cardForeground,
    fontFamily: fontFamilies.base.semiBold,
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  message: {
    color: theme.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
}));
