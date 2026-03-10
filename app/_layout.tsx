import { Tabs } from "expo-router";

export default function Layout() {
    return (
        <Tabs>
            <Tabs.Screen 
                name="index" 
                options={{ 
                    headerTitle: "Home",
                    tabBarLabel: "Accueil",
                    tabBarIcon: () => null, // icône optionnelle
                }} 
            />
            <Tabs.Screen 
                name="Page2" 
                options={{ 
                    headerTitle: "Page 2",
                    tabBarLabel: "Page 2",
                }} 
            />
            <Tabs.Screen 
                name="TestContext" 
                options={{ 
                    headerTitle: "Test Context",
                    tabBarLabel: "Context",
                }} 
            />
            <Tabs.Screen 
                name="Music" 
                options={{ 
                    headerTitle: "Music",
                    tabBarLabel: "Music",
                }} 
            />
        </Tabs>
    );
}