// app/Geolocalisation.tsx
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useWeather } from '../context/WeatherContext';

export default function Geolocalisation() {
  const {
    temperature, weatherCode, cityName, currentMood,
    active, errorMsg, activate, deactivate,
  } = useWeather();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Météo locale</Text>
      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

      {/* ── Carte météo ── */}
      {active && cityName && temperature !== null && currentMood && (
        <View style={[styles.card, { borderColor: currentMood.color, borderWidth: 2 }]}>
          <Text style={styles.city}>📍 {cityName}</Text>
          <Text style={styles.emoji}>{currentMood.emoji}</Text>
          <Text style={styles.temp}>{temperature}°C</Text>

          {/* Badge ambiance */}
          <View style={[styles.moodBadge, { backgroundColor: currentMood.color + '33' }]}>
            <Text style={[styles.moodLabel, { color: currentMood.color }]}>
              {currentMood.label}
            </Text>
          </View>

          {/* Info playlist auto */}
          <Text style={styles.hint}>
            🎵 La playlist "{currentMood.label}" se lance automatiquement
          </Text>
        </View>
      )}

      {/* ── Bouton activation ── */}
      {!active ? (
        <Pressable style={styles.btn} onPress={activate}>
          <Text style={styles.btnText}>📍 Activer la géolocalisation</Text>
        </Pressable>
      ) : (
        <Pressable style={[styles.btn, styles.btnStop]} onPress={deactivate}>
          <Text style={styles.btnText}>⏹ Désactiver</Text>
        </Pressable>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  {
    flex: 1, backgroundColor: '#0F0F1A',
    alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: 24,
  },
  title:      { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  card:       {
    backgroundColor: '#1E1E2E', borderRadius: 16,
    padding: 24, alignItems: 'center', gap: 10,
    width: '100%',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  city:       { fontSize: 18, fontWeight: '600', color: '#fff' },
  emoji:      { fontSize: 72 },
  temp:       { fontSize: 52, fontWeight: 'bold', color: '#fff' },
  moodBadge:  {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, marginTop: 4,
  },
  moodLabel:  { fontSize: 15, fontWeight: '600' },
  hint:       { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  btn:        {
    backgroundColor: '#7C3AED', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 28,
    width: '100%', alignItems: 'center',
  },
  btnStop:    { backgroundColor: '#374151' },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '600' },
  error:      { fontSize: 14, color: '#EF4444' },
});