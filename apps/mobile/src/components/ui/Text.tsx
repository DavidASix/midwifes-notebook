import { Text as RNText, TextProps as RNTextProps } from "react-native";
import { fontFamilies } from "../../lib/themes";

type TextProps = RNTextProps & {
  header?: boolean;
};

export function Text({ header: heading, style, ...props }: TextProps) {
  const fontFamily = heading ? fontFamilies.heading : fontFamilies.base;
  return <RNText style={[{ fontFamily }, style]} {...props} />;
}
