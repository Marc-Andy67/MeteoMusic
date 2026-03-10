import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useState, useRef } from 'react';
import * as Location from 'expo-location';
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
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMeteo = async (lat: number, lon: number) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    setTemperature(data.current.temperature_2m);
    setWeatherCode(data.current.weather_code);

    const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'MeteoMusicApp/1.0' } });
    const geoData = await geoRes.json();
    const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Ville inconnue';
    setCityName(city);

    // ─── Sauvegarde pour la page d'accueil ───────────────────────────────
    await AsyncStorage.setItem('meteo', JSON.stringify({
      cityName: city,
      temperature: data.current.temperature_2m,
      weatherCode: data.current.weather_code,
    }));
  };

  const activerGeolocalisation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission refusée');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);
    setActive(true);
    await fetchMeteo(loc.coords.latitude, loc.coords.longitude);
    intervalRef.current = setInterval(async () => {
      const newLoc = await Location.getCurrentPositionAsync({});
      setLocation(newLoc);
      await fetchMeteo(newLoc.coords.latitude, newLoc.coords.longitude);
    }, 120000);
  };

  const desactiverGeolocalisation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setLocation(null);
    setActive(false);
    setTemperature(null);
    setWeatherCode(null);
    setCityName(null);
    AsyncStorage.removeItem('meteo'); // ─── Supprime la météo sauvegardée ───
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Météo locale</Text>
      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
      {active && cityName && temperature !== null && weatherCode !== null && (
        <View style={styles.card}>
          <Text style={styles.city}>📍 {cityName}</Text>
          <Text style={styles.emoji}>{getWeatherEmoji(weatherCode)}</Text>
          <Text style={styles.temp}>{temperature}°C</Text>
        </View>
      )}
      {!active && <Button title="Activer la géolocalisation" onPress={activerGeolocalisation} />}
      {active && <Button title="Désactiver la géolocalisation" onPress={desactiverGeolocalisation} />}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, width: '100%' },
  city: { fontSize: 18, fontWeight: '600', color: '#333' },
  emoji: { fontSize: 64 },
  temp: { fontSize: 48, fontWeight: 'bold', color: '#333' },
  error: { fontSize: 14, color: 'red' },
});