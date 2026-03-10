// app/music.tsx
import { useState, Suspense, use } from 'react';
import {
  View, Text, FlatList, Pressable,
  ActivityIndicator, StyleSheet, Image
} from 'react-native';
import { Audio } from 'expo-av';

// ─── Types ────────────────────────────────────────────────────────────────────
type Track = {
  id: string;
  name: string;
  artist_name: string;
  album_image: string;
  audio: string; // URL MP3 directement jouable 🎵
};

// ─── Config ───────────────────────────────────────────────────────────────────
const CLIENT_ID = 'c3e93b7e'; // → https://developer.jamendo.com
const BASE = 'https://api.jamendo.com/v3.0';

// ─── Promise créée EN DEHORS du composant (pattern use() + Suspense) ──────────
const tracksPromise: Promise<Track[]> = fetch(
  `${BASE}/tracks?client_id=${CLIENT_ID}&format=json&limit=999&imagesize=200`
)
  .then(res => res.json())
  .then(data => data.results);

// ─── Composant liste ──────────────────────────────────────────────────────────
function TrackList() {
  const tracks = use(tracksPromise);           // suspend jusqu'à résolution
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  async function togglePlay(track: Track) {
    // Si une musique joue déjà → on la stop
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      setCurrentSound(null);
      // Si on re-clique sur la même → juste stop
      if (playingId === track.id) {
        setPlayingId(null);
        return;
      }
    }

    // Charger et jouer le nouveau track
    const { sound } = await Audio.Sound.createAsync({ uri: track.audio });
    setCurrentSound(sound);
    setPlayingId(track.id);
    await sound.playAsync();
  }

  return (
    <FlatList
      data={tracks}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const isPlaying = playingId === item.id;
        return (
          <Pressable
            style={[styles.card, isPlaying && styles.cardActive]}
            onPress={() => togglePlay(item)}
          >
            <Image source={{ uri: item.album_image }} style={styles.cover} />
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.artist} numberOfLines={1}>{item.artist_name}</Text>
            </View>
            <Text style={styles.icon}>{isPlaying ? '⏹' : '▶️'}</Text>
          </Pressable>
        );
      }}
    />
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function MusicPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🎵 Jamendo</Text>

      {/* Suspense affiche le spinner pendant le fetch */}
      <Suspense fallback={
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loading}>Chargement des musiques...</Text>
        </View>
      }>
        <TrackList />
      </Suspense>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1E1E2E', borderRadius: 12, padding: 12,
  },
  cardActive: { backgroundColor: '#3B1F6E', borderColor: '#7C3AED', borderWidth: 1 },
  cover: { width: 56, height: 56, borderRadius: 8 },
  info: { flex: 1 },
  title: { color: '#fff', fontWeight: '600', fontSize: 15 },
  artist: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  icon: { fontSize: 22 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loading: { color: '#9CA3AF', fontSize: 16 },
});