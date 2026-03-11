// app/index.tsx
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useWeather } from '../context/WeatherContext';
import { global } from '../styles/global';

export default function App() {
  const router = useRouter();
  const { temperature, cityName, currentMood, active } = useWeather();

  return (
    <View style={global.screenCentered}>
      <Text style={global.headerTitle}>🎵 MeteoMusic</Text>

      {active && cityName && temperature !== null && currentMood ? (
        <View style={[global.card, styles.cardFull, { borderColor: currentMood.color, borderWidth: 2 }]}>
          <Text style={styles.city}>📍 {cityName}</Text>
          <Text style={styles.emoji}>{currentMood.emoji}</Text>
          <Text style={styles.temp}>{temperature}°C</Text>
          <View style={[global.moodBadge, { backgroundColor: currentMood.color + '33' }]}>
            <Text style={[global.moodLabel, { color: currentMood.color }]}>{currentMood.label}</Text>
          </View>
          <Text style={global.hint}>🎵 La playlist "{currentMood.label}" se lance automatiquement</Text>
        </View>
      ) : (
        <View style={[global.card, styles.cardFull]}>
          <Text style={global.textSecondary}>Aucune météo disponible</Text>
          <Text style={global.hint}>Active la géolocalisation pour commencer</Text>
        </View>
      )}

      <Pressable style={global.btnFull} onPress={() => router.push('/Geolocalisation')}>
        <Text style={global.btnText}>📍 Géolocalisation</Text>
      </Pressable>
      <Pressable style={global.btnFull} onPress={() => router.push('/playlist-index')}>
        <Text style={global.btnText}>🎶 Mes Playlists</Text>
      </Pressable>
      <Pressable style={[global.btnFull, styles.btnSecondary]} onPress={() => router.push('/Music')}>
        <Text style={global.btnText}>🎵 Parcourir la musique</Text>
      </Pressable>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  cardFull:    { width: '100%', alignItems: 'center', gap: 10 },
  city:        { fontSize: 18, fontWeight: '600', color: '#fff' },
  emoji:       { fontSize: 72 },
  temp:        { fontSize: 52, fontWeight: 'bold', color: '#fff' },
  btnSecondary: { backgroundColor: '#1E1E2E' },
});