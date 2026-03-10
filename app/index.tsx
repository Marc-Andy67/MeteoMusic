// app/index.tsx
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useWeather } from '../context/WeatherContext';

export default function App() {
  const router = useRouter();
  const { temperature, cityName, currentMood, active } = useWeather();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🎵 MeteoMusic</Text>

      {/* ── Carte météo ── */}
      {active && cityName && temperature !== null && currentMood ? (
        <View style={[styles.card, { borderColor: currentMood.color, borderWidth: 2 }]}>
          <Text style={styles.city}>📍 {cityName}</Text>
          <Text style={styles.emoji}>{currentMood.emoji}</Text>
          <Text style={styles.temp}>{temperature}°C</Text>
          <View style={[styles.moodBadge, { backgroundColor: currentMood.color + '33' }]}>
            <Text style={[styles.moodLabel, { color: currentMood.color }]}>
              {currentMood.label}
            </Text>
          </View>
          <Text style={styles.hint}>
            🎵 La playlist "{currentMood.label}" se lance automatiquement
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.noMeteo}>Aucune météo disponible</Text>
          <Text style={styles.hint}>Active la géolocalisation pour commencer</Text>
        </View>
      )}

      {/* ── Navigation ── */}
      <Pressable style={styles.btn} onPress={() => router.push('/Geolocalisation')}>
        <Text style={styles.btnText}>📍 Géolocalisation</Text>
      </Pressable>

      <Pressable style={styles.btn} onPress={() => router.push('/playlist-index')}>
        <Text style={styles.btnText}>🎶 Mes Playlists</Text>
      </Pressable>

      <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => router.push('/Music')}>
        <Text style={styles.btnText}>🎵 Parcourir la musique</Text>
      </Pressable>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   {
    flex: 1, backgroundColor: '#0F0F1A',
    alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 24,
  },
  header:      { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  card:        {
    width: '100%', backgroundColor: '#1E1E2E',
    borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  city:        { fontSize: 18, fontWeight: '600', color: '#fff' },
  emoji:       { fontSize: 72 },
  temp:        { fontSize: 52, fontWeight: 'bold', color: '#fff' },
  moodBadge:   { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 4 },
  moodLabel:   { fontSize: 15, fontWeight: '600' },
  hint:        { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  noMeteo:     { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  btn:         {
    width: '100%', backgroundColor: '#7C3AED',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  btnSecondary: { backgroundColor: '#1E1E2E' },
  btnText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
});