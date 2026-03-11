// app/index.tsx
// Page d'accueil de l'application.
// Elle affiche la météo actuelle et des boutons pour naviguer vers les autres pages.

import { StyleSheet, Text, View, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useWeather } from '../context/WeatherContext'; // Hook pour accéder au contexte météo global

export default function App() {
  const router = useRouter(); // Permet de naviguer vers d'autres pages

  // ── useWeather() ──────────────────────────────────────────────────────────
  // On récupère depuis le contexte global WeatherContext :
  // - temperature : la température actuelle en °C
  // - cityName    : le nom de la ville détectée
  // - currentMood : l'objet ambiance (emoji, couleur, label) selon la météo
  // - active      : true si la géolocalisation est activée
  const { temperature, cityName, currentMood, active } = useWeather();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🎵 MeteoMusic</Text>

      {/* ── Carte météo ──────────────────────────────────────────────────────
          Condition : on affiche la météo SEULEMENT si :
          - active      : la géolocalisation est activée
          - cityName    : on a bien récupéré une ville
          - temperature : la température est disponible (pas null)
          - currentMood : l'ambiance a bien été calculée
          Sinon on affiche le message "Aucune météo disponible" */}
      {active && cityName && temperature !== null && currentMood ? (

        // Carte météo avec une bordure colorée selon l'ambiance (currentMood.color)
        <View style={[styles.card, { borderColor: currentMood.color, borderWidth: 2 }]}>
          <Text style={styles.city}>📍 {cityName}</Text>
          <Text style={styles.emoji}>{currentMood.emoji}</Text>
          <Text style={styles.temp}>{temperature}°C</Text>

          {/* Badge ambiance : fond semi-transparent avec la couleur de l'ambiance
              Le '33' à la fin de la couleur hex = 20% d'opacité */}
          <View style={[styles.moodBadge, { backgroundColor: currentMood.color + '33' }]}>
            <Text style={[styles.moodLabel, { color: currentMood.color }]}>
              {currentMood.label}
            </Text>
          </View>

          {/* Info playlist automatique */}
          <Text style={styles.hint}>
            🎵 La playlist "{currentMood.label}" se lance automatiquement
          </Text>
        </View>

      ) : (
        // Carte vide si pas de météo disponible
        <View style={styles.card}>
          <Text style={styles.noMeteo}>Aucune météo disponible</Text>
          <Text style={styles.hint}>Active la géolocalisation pour commencer</Text>
        </View>
      )}

      {/* ── Boutons de navigation ─────────────────────────────────────────────
          router.push('/NomDeLaPage') navigue vers app/NomDeLaPage.tsx */}

      {/* Vers la page géolocalisation pour activer/désactiver la météo */}
      <Pressable style={styles.btn} onPress={() => router.push('/Geolocalisation')}>
        <Text style={styles.btnText}>📍 Géolocalisation</Text>
      </Pressable>

      {/* Vers la liste des playlists */}
      <Pressable style={styles.btn} onPress={() => router.push('/playlist-index')}>
        <Text style={styles.btnText}>🎶 Mes Playlists</Text>
      </Pressable>

      {/* Vers la page de navigation musicale — style secondaire (fond plus sombre) */}
      <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => router.push('/Music')}>
        <Text style={styles.btnText}>🎵 Parcourir la musique</Text>
      </Pressable>

      <StatusBar style="light" />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    {
    flex: 1, backgroundColor: '#0F0F1A',  // Fond sombre
    alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 24,
  },
  header:       { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  card:         {
    width: '100%', backgroundColor: '#1E1E2E',  // Fond carte légèrement plus clair
    borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  city:         { fontSize: 18, fontWeight: '600', color: '#fff' },
  emoji:        { fontSize: 72 },
  temp:         { fontSize: 52, fontWeight: 'bold', color: '#fff' },
  moodBadge:    { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 4 },
  moodLabel:    { fontSize: 15, fontWeight: '600' },
  hint:         { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  noMeteo:      { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  btn:          {
    width: '100%', backgroundColor: '#7C3AED',  // Violet principal
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  btnSecondary: { backgroundColor: '#1E1E2E' },  // Bouton secondaire plus discret
  btnText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
});