import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#007AFF",
                tabBarInactiveTintColor: "#999",
                headerShown: false,
            }}
        >
            <Tabs.Screen 
                name="today" 
                options={{ 
                    title: "Today",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="today" color={color} size={size} />
                    ),
                }} 
            />
            <Tabs.Screen
                name="week"
                options={{
                    title: "Week",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="date-range" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen 
                name="rules" 
                options={{ 
                    title: "Rules",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="rule" color={color} size={size} />
                    ),
                }} 
            />
        </Tabs>
    )
}