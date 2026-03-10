// app/playlists-detail.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, Modal,
  StyleSheet, Image, ScrollView, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Audio } from 'expo-av';
import {
  Playlist, Track, WEATHER_MOODS,
  loadPlaylists, addTrackToPlaylist, removeTrackFromPlaylist
} from '../storage/playlist';

const CLIENT_ID = 'c3e93b7e';
const BASE = 'https://api.jamendo.com/v3.0';

export default function PlaylistDetail() {
  // Récupère l'id passé en query param : /playlists-detail?id=xxx
  const { id } = useLocalSearchParams<{ id: string }>();

  const [playlist,   setPlaylist]  = useState<Playlist | null>(null);
  const [sound,      setSound]     = useState<Audio.Sound | null>(null);
  const [playingId,  setPlayingId] = useState<string | null>(null);
  const [addModal,   setAddModal]  = useState(false);
  const [jamTracks,  setJamTracks] = useState<Track[]>([]);
  const [jamLoading, setJamLoading]= useState(false);

  const load = useCallback(async () => {
    const all = await loadPlaylists();
    setPlaylist(all.find(p => p.id === id) ?? null);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function togglePlay(track: Track) {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      if (playingId === track.id) { setPlayingId(null); return; }
    }
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound: s } = await Audio.Sound.createAsync({ uri: track.audio });
    setSound(s);
    setPlayingId(track.id);
    await s.playAsync();
  }

  async function handleRemove(trackId: string) {
    if (!playlist) return;
    await removeTrackFromPlaylist(playlist.id, trackId);
    load();
  }

  async function openAddModal() {
    setAddModal(true);
    if (jamTracks.length > 0) return;
    setJamLoading(true);
    const res = await fetch(
      `${BASE}/tracks?client_id=${CLIENT_ID}&format=json&limit=50&imagesize=200&order=popularity_total`
    );
    const data = await res.json();
    setJamTracks(data.results);
    setJamLoading(false);
  }

  async function handleAdd(track: Track) {
    if (!playlist) return;
    await addTrackToPlaylist(playlist.id, track);
    load();
  }

  if (!playlist) return (
    <View style={styles.center}>
      <ActivityIndicator color="#7C3AED" size="large" />
    </View>
  );

  const weather = WEATHER_MOODS.find(w => w.id === playlist.weatherId);

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{playlist.name}</Text>
          {weather && (
            <View style={[styles.weatherTag, { backgroundColor: weather.color + '33' }]}>
              <Text style={styles.weatherEmoji}>{weather.emoji}</Text>
              <Text style={[styles.weatherLabel, { color: weather.color }]}>{weather.label}</Text>
            </View>
          )}
          <Text style={styles.meta}>
            {playlist.tracks.length} morceau{playlist.tracks.length !== 1 ? 'x' : ''}
          </Text>
        </View>
      </View>

      {/* ── Tracks ── */}
      <FlatList
        data={playlist.tracks}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎵</Text>
            <Text style={styles.emptyText}>Aucun morceau</Text>
            <Text style={styles.emptyHint}>Appuie sur + pour en ajouter</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isPlaying = playingId === item.id;
          return (
            <View style={[styles.trackCard, isPlaying && styles.trackCardActive]}>
              <Pressable style={styles.trackLeft} onPress={() => togglePlay(item)}>
                <Image source={{ uri: item.album_image }} style={styles.cover} />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.artistName} numberOfLines={1}>{item.artist_name}</Text>
                </View>
                <Text style={styles.playIcon}>{isPlaying ? '⏹' : '▶️'}</Text>
              </Pressable>
              <Pressable onPress={() => handleRemove(item.id)} style={styles.removeBtn}>
                <Text style={styles.removeIcon}>✕</Text>
              </Pressable>
            </View>
          );
        }}
      />

      {/* ── FAB ── */}
      <Pressable style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {/* ── Modal ajout Jamendo ── */}
      <Modal visible={addModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setAddModal(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Ajouter depuis Jamendo</Text>
          {jamLoading
            ? <ActivityIndicator color="#7C3AED" style={{ marginTop: 24 }} />
            : (
              <ScrollView style={{ maxHeight: 420 }}>
                {jamTracks.map(track => {
                  const alreadyIn = playlist.tracks.some(t => t.id === track.id);
                  return (
                    <Pressable
                      key={track.id}
                      style={[styles.jamCard, alreadyIn && styles.jamCardAdded]}
                      onPress={() => !alreadyIn && handleAdd(track)}
                    >
                      <Image source={{ uri: track.album_image }} style={styles.jamCover} />
                      <View style={styles.jamInfo}>
                        <Text style={styles.jamName} numberOfLines={1}>{track.name}</Text>
                        <Text style={styles.jamArtist} numberOfLines={1}>{track.artist_name}</Text>
                      </View>
                      <Text style={[styles.addIcon, alreadyIn && { color: '#22C55E' }]}>
                        {alreadyIn ? '✓' : '+'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )
          }
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0F0F1A', paddingTop: 60 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' },

  header:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                    paddingHorizontal: 16, marginBottom: 20 },
  backBtn:        { paddingTop: 4 },
  backIcon:       { color: '#7C3AED', fontSize: 36, lineHeight: 36 },
  headerInfo:     { flex: 1, gap: 6 },
  title:          { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  weatherTag:     { flexDirection: 'row', alignItems: 'center', gap: 6,
                    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  weatherEmoji:   { fontSize: 16 },
  weatherLabel:   { fontSize: 13, fontWeight: '600' },
  meta:           { color: '#6B7280', fontSize: 13 },

  list:           { padding: 16, gap: 10, paddingBottom: 100 },
  trackCard:      { flexDirection: 'row', alignItems: 'center',
                    backgroundColor: '#1E1E2E', borderRadius: 12, overflow: 'hidden' },
  trackCardActive:{ borderWidth: 1, borderColor: '#7C3AED', backgroundColor: '#2D1B4E' },
  trackLeft:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  cover:          { width: 48, height: 48, borderRadius: 8 },
  trackInfo:      { flex: 1 },
  trackName:      { color: '#fff', fontSize: 15, fontWeight: '600' },
  artistName:     { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  playIcon:       { fontSize: 20 },
  removeBtn:      { padding: 16, borderLeftWidth: 1, borderLeftColor: '#2D2D40' },
  removeIcon:     { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },

  empty:          { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji:     { fontSize: 48 },
  emptyText:      { color: '#9CA3AF', fontSize: 17, fontWeight: '500' },
  emptyHint:      { color: '#4B5563', fontSize: 14 },

  fab:            { position: 'absolute', bottom: 32, right: 24, width: 60, height: 60,
                    borderRadius: 30, backgroundColor: '#7C3AED',
                    justifyContent: 'center', alignItems: 'center',
                    shadowColor: '#7C3AED', shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  fabText:        { color: '#fff', fontSize: 32, lineHeight: 36 },

  overlay:        { flex: 1, backgroundColor: '#00000088' },
  sheet:          { backgroundColor: '#1A1A2E', borderTopLeftRadius: 24, borderTopRightRadius: 24,
                    padding: 24, gap: 12 },
  sheetTitle:     { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  jamCard:        { flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2D2D40' },
  jamCardAdded:   { opacity: 0.5 },
  jamCover:       { width: 44, height: 44, borderRadius: 8 },
  jamInfo:        { flex: 1 },
  jamName:        { color: '#fff', fontSize: 14, fontWeight: '600' },
  jamArtist:      { color: '#9CA3AF', fontSize: 12 },
  addIcon:        { color: '#7C3AED', fontSize: 22, fontWeight: 'bold', width: 28, textAlign: 'center' },
});