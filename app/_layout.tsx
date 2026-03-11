// app/_layout.tsx
// Ce fichier est le point d'entrée de toute l'application.
// Il définit la structure globale : les providers, la barre de navigation, et les composants flottants.

import { Tabs } from 'expo-router';         // Composant qui crée la barre de navigation en bas
import { Text } from 'react-native';
import { PlayerProvider }  from '../context/PlayerContext';   // Contexte global pour le lecteur audio
import { WeatherProvider } from '../context/WeatherContext';  // Contexte global pour la météo
import MiniPlayer from '../components/MiniPlayer';            // Composant flottant du mini lecteur

export default function Layout() {
  return (

    // ── PlayerProvider ────────────────────────────────────────────────────────
    // Enveloppe TOUTE l'app avec le contexte du lecteur audio.
    // Cela permet à n'importe quelle page d'accéder aux infos du lecteur
    // (chanson en cours, play/pause, etc.) via usePlayer()
    // Il doit être en PREMIER car WeatherProvider l'utilise à l'intérieur.
    <PlayerProvider>

      {/* ── WeatherProvider ──────────────────────────────────────────────────
          Enveloppe toute l'app avec le contexte météo.
          Toutes les pages peuvent accéder à la météo via useWeather()
          (température, ville, emoji météo, etc.)
          Il est à l'INTÉRIEUR de PlayerProvider car il peut avoir besoin
          de déclencher de la musique en fonction de la météo. */}
      <WeatherProvider>

        {/* ── Tabs ─────────────────────────────────────────────────────────
            Crée la barre de navigation en bas de l'écran.
            Chaque Tabs.Screen correspond à un fichier dans le dossier app/.
            Par exemple name="index" → app/index.tsx */}
        <Tabs>

          {/* Page d'accueil → app/index.tsx */}
          <Tabs.Screen
            name="index"
            options={{
              headerTitle: 'Home',        // Titre affiché en haut de la page
              tabBarLabel: 'Accueil',     // Label affiché sous l'icône dans la tab bar
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>, // Icône emoji
            }}
          />

          {/* Page météo → app/Geolocalisation.tsx */}
          <Tabs.Screen
            name="Geolocalisation"
            options={{
              headerTitle: 'Météo',
              tabBarLabel: 'Météo',
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>📍</Text>,
            }}
          />

          {/* Page musique → app/Music.tsx */}
          <Tabs.Screen
            name="Music"
            options={{
              headerTitle: 'Music',
              tabBarLabel: 'Music',
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎵</Text>,
            }}
          />

          {/* Page playlists → app/playlist-index.tsx */}
          <Tabs.Screen
            name="playlist-index"
            options={{
              headerTitle: 'Playlists',
              tabBarLabel: 'Playlists',
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎶</Text>,
            }}
          />

          {/* ── Pages cachées ─────────────────────────────────────────────
              Ces pages existent dans le dossier app/ mais on ne veut PAS
              qu'elles apparaissent dans la tab bar.
              href: null = page accessible via router.push() mais invisible
              dans la navigation en bas. */}
          <Tabs.Screen name="playlists-detail" options={{ href: null }} />

        </Tabs>

        {/* ── MiniPlayer ───────────────────────────────────────────────────
            Composant flottant affiché PAR DESSUS toutes les pages.
            Comme il est en dehors de <Tabs>, il reste visible peu importe
            sur quelle page on se trouve.
            Il affiche la chanson en cours et les boutons play/pause/suivant. */}
        <MiniPlayer />

      </WeatherProvider>
    </PlayerProvider>
  );
}