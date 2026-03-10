import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function Layout() {
    return (
        <Tabs>
            <Tabs.Screen 
                name="index" 
                options={{ 
                    headerTitle: "Home",
                    tabBarLabel: "Accueil",
                    tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
                }} 
            />
            <Tabs.Screen 
                name="Geolocalisation" 
                options={{ 
                    headerTitle: "Géolocalisation",
                    tabBarLabel: "Géolocalisation",
                    tabBarIcon: () => <Text style={{ fontSize: 20 }}>📍</Text>,
                }} 
            />
            <Tabs.Screen 
                name="Music" 
                options={{ 
                    headerTitle: "Music",
                    tabBarLabel: "Music",
                    tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎧</Text>,
                }} 
            />
            <Tabs.Screen 
                name="playlists-index" 
                options={{ 
                    headerTitle: "Playlists",
                    tabBarLabel: "Playlists",
                }} 
            />
        </Tabs>
    );
}