import { Redirect } from "expo-router";
import { SKIP_ONBOARDING } from "./_layout";

/** Redirects to the first screen inside the authenticated (app) group. */
export default function Index() {
  return (
    <Redirect href={SKIP_ONBOARDING ? "/(app)/(tabs)" : "/(app)/onboarding"} />
  );
}
