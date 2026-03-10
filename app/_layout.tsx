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
                name="Geolocalisation" 
                options={{ 
                    headerTitle: "Géolocalisation",
                    tabBarLabel: "Géolocalisation",
                }} 
            />
            <Tabs.Screen 
                name="Playlist" 
                options={{ 
                    headerTitle: "Playlists",
                    tabBarLabel: "Playlists",
                }} 
            />
        </Tabs>
    );
}