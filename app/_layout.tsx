// app/_layout.tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { PlayerProvider }  from '../context/PlayerContext';
import { WeatherProvider } from '../context/Weathercontext';
import MiniPlayer from '../components/MiniPlayer';

export default function Layout() {
  return (
    // ── Ordre important : PlayerProvider en premier car WeatherProvider l'utilise
    <PlayerProvider>
      <WeatherProvider>

        <Tabs>
          <Tabs.Screen
            name="index"
            options={{
              headerTitle: 'Home',
              tabBarLabel: 'Accueil',
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
            }}
          />
          <Tabs.Screen
            name="Geolocalisation"
            options={{
              headerTitle: 'Météo',
              tabBarLabel: 'Météo',
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>📍</Text>,
            }}
          />
          <Tabs.Screen
            name="Music"
            options={{
              headerTitle: 'Music',
              tabBarLabel: 'Music',
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎵</Text>,
            }}
          />
          <Tabs.Screen
            name="playlists-index"
            options={{
              headerTitle: 'Playlists',
              tabBarLabel: 'Playlists',
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎶</Text>,
            }}
          />

          {/* Pages cachées de la tab bar */}
          <Tabs.Screen name="playlists-detail" options={{ href: null }} />
          <Tabs.Screen name="Playlist"         options={{ href: null }} />
          <Tabs.Screen name="TestContext"       options={{ href: null }} />
        </Tabs>

        {/* MiniPlayer flottant en haut sur toutes les pages */}
        <MiniPlayer />

      </WeatherProvider>
    </PlayerProvider>
  );
}