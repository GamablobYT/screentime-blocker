import { Tabs } from "expo-router";

export default function TabsLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="today" options={{ title: "Today" }} />
        </Tabs>
    )
}