import { Redirect } from "expo-router";

/** Redirects to the first screen inside the authenticated (app) group. */
export default function Index() {
  return <Redirect href={"/onboarding"} />;
}
