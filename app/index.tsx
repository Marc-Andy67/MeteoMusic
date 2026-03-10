// app/index.tsx
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useWeather } from '../context/WeatherContext';

export default function App() {
  const router = useRouter();
  const message = 'MeteoMusic';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{message}</Text>
      <Button title="Cherchez votre localisation" onPress={() => router.push('/Geolocalisation')} />
      <Button title="Voir mes playlists" onPress={() => router.push('/playlist-index')} />
      <StatusBar style="auto" />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  text: { fontSize: 16, color: '#333' },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  sub: { fontSize: 12, color: '#888', textAlign: 'center' },
});