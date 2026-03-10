import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

export default function App() {
  const router = useRouter();
  const message = 'MeteoMusic';
  const [meteo, setMeteo] = useState<{ cityName: string; temperature: number; weatherCode: number } | null>(null);

  // ─── Recharge la météo à chaque fois qu'on revient sur la page ───────────
  useFocusEffect(
    useCallback(() => {
      const chargerMeteo = async () => {
        const data = await AsyncStorage.getItem('meteo');
        if (data) setMeteo(JSON.parse(data));
        else setMeteo(null);
      };
      chargerMeteo();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{message}</Text>

      {meteo ? (
        <View style={styles.card}>
          <Text style={styles.city}>📍 {meteo.cityName}</Text>
          <Text style={styles.emoji}>{getWeatherEmoji(meteo.weatherCode)}</Text>
          <Text style={styles.temp}>{meteo.temperature}°C</Text>
        </View>
      ) : (
        <Text style={styles.text}>Aucune météo disponible</Text>
      )}

      <Button title="Cherchez votre localisation" onPress={() => router.push('/Geolocalisation')} />
      <Button title="Voir mes playlists" onPress={() => router.push('/playlist-index')} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  text: { fontSize: 16, color: '#333' },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  city: { fontSize: 18, fontWeight: '600', color: '#333' },
  emoji: { fontSize: 64 },
  temp: { fontSize: 48, fontWeight: 'bold', color: '#333' },
});