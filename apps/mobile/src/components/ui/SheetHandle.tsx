import { View } from "react-native";

import { makeStyles } from "@/lib/make-styles";

/** A decorative drag affordance for native form-sheet presentations. */
export function SheetHandle() {
  const styles = useStyles();

  return (
    <View accessible={false} style={styles.container}>
      <View style={styles.handle} />
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 2,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.mutedForeground,
    opacity: 0.45,
  },
}));
