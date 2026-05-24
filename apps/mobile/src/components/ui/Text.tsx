import { Text as RNText, TextProps as RNTextProps } from "react-native";
import { fontFamilies } from "../../lib/themes";
import { makeStyles } from "../../lib/make-styles";

type TextProps = RNTextProps & {
  header?: boolean;
};

const useStyles = makeStyles((theme) => ({
  base: { color: theme.foreground },
}));

export function Text({ header: heading, style, ...props }: TextProps) {
  const styles = useStyles();
  const fontFamily = heading ? fontFamilies.heading : fontFamilies.base;
  return <RNText style={[styles.base, { fontFamily }, style]} {...props} />;
}
