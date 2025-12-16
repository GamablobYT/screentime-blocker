import { Redirect } from "expo-router";

export default function Index() {
  // Immediately redirect root to the tabs layout
  return <Redirect href="/(tabs)/today" />;
}
