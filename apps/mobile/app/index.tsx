import { Redirect } from "expo-router";
import { SKIP_ONBOARDING } from "./_layout";

export default function Index() {
  return <Redirect href={SKIP_ONBOARDING ? "/(tabs)" : "/onboarding"} />;
}
