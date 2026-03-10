// app/playlists-index.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput,
  StyleSheet, Modal, ScrollView, Alert
} from 'react-native';
import { router } from 'expo-router';
import {
  Playlist, WEATHER_MOODS,
  loadPlaylists, createPlaylist, deletePlaylist
} from '../storage/playlist';

export default function PlaylistsPage() {
  const [playlists, setPlaylists]     = useState<Playlist[]>([]);
  const [modalVisible, setModal]      = useState(false);
  const [newName, setNewName]         = useState('');
  const [selectedWeather, setWeather] = useState<string | null>(null);

  const load = useCallback(async () => {
    setPlaylists(await loadPlaylists());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!newName.trim()) return;
    await createPlaylist(newName.trim(), selectedWeather);
    setNewName('');
    setWeather(null);
    setModal(false);
    load();
  }

  async function handleDelete(id: string) {
    Alert.alert('Supprimer', 'Supprimer cette playlist ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await deletePlaylist(id);
        load();
      }},
    ]);
  }

  const getWeather = (id: string | null) =>
    WEATHER_MOODS.find(w => w.id === id);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🎶 Mes Playlists</Text>

      <FlatList
        data={playlists}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎵</Text>
            <Text style={styles.emptyText}>Aucune playlist pour l'instant</Text>
            <Text style={styles.emptyHint}>Appuie sur + pour en créer une</Text>
          </View>
        }
        renderItem={({ item }) => {
          const weather = getWeather(item.weatherId);
          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/playlists-detail?id=${item.id}`)}
            >
              <View style={[styles.weatherBadge, { backgroundColor: weather ? weather.color + '33' : '#2D2D40' }]}>
                <Text style={styles.weatherEmoji}>{weather ? weather.emoji : '🎵'}</Text>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardMeta}>
                  {item.tracks.length} morceau{item.tracks.length !== 1 ? 'x' : ''}
                  {weather ? `  ·  ${weather.label}` : ''}
                </Text>
              </View>

              <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </Pressable>

              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => setModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {/* ── Modal création ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setModal(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Nouvelle playlist</Text>

          <TextInput
            style={styles.input}
            placeholder="Nom de la playlist..."
            placeholderTextColor="#6B7280"
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />

          <Text style={styles.sheetLabel}>Ambiance météo (optionnel)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weatherRow}
          >
            {WEATHER_MOODS.map(w => (
              <Pressable
                key={w.id}
                onPress={() => setWeather(selectedWeather === w.id ? null : w.id)}
                style={[
                  styles.weatherChip,
                  { borderColor: w.color },
                  selectedWeather === w.id && { backgroundColor: w.color + '44' }
                ]}
              >
                <Text style={styles.weatherChipEmoji}>{w.emoji}</Text>
                <Text style={[styles.weatherChipLabel, { color: w.color }]}>{w.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={[styles.createBtn, !newName.trim() && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!newName.trim()}
          >
            <Text style={styles.createBtnText}>Créer la playlist</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#0F0F1A', paddingTop: 60 },
  header:            { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  list:              { padding: 16, gap: 12, paddingBottom: 100 },

  card:              { flexDirection: 'row', alignItems: 'center', gap: 12,
                       backgroundColor: '#1E1E2E', borderRadius: 14, padding: 14 },
  weatherBadge:      { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  weatherEmoji:      { fontSize: 24 },
  cardInfo:          { flex: 1 },
  cardName:          { color: '#fff', fontSize: 16, fontWeight: '600' },
  cardMeta:          { color: '#6B7280', fontSize: 13, marginTop: 3 },
  deleteBtn:         { padding: 6 },
  deleteIcon:        { fontSize: 18 },
  chevron:           { color: '#4B5563', fontSize: 24 },

  empty:             { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyEmoji:        { fontSize: 48 },
  emptyText:         { color: '#9CA3AF', fontSize: 17, fontWeight: '500' },
  emptyHint:         { color: '#4B5563', fontSize: 14 },

  fab:               { position: 'absolute', bottom: 32, right: 24, width: 60, height: 60,
                       borderRadius: 30, backgroundColor: '#7C3AED',
                       justifyContent: 'center', alignItems: 'center',
                       shadowColor: '#7C3AED', shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  fabText:           { color: '#fff', fontSize: 32, lineHeight: 36 },

  overlay:           { flex: 1, backgroundColor: '#00000088' },
  sheet:             { backgroundColor: '#1A1A2E', borderTopLeftRadius: 24, borderTopRightRadius: 24,
                       padding: 24, gap: 16 },
  sheetTitle:        { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  sheetLabel:        { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
  input:             { backgroundColor: '#0F0F1A', color: '#fff', borderRadius: 12,
                       padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#2D2D40' },
  weatherRow:        { gap: 8, paddingVertical: 4 },
  weatherChip:       { flexDirection: 'row', alignItems: 'center', gap: 6,
                       paddingHorizontal: 12, paddingVertical: 8,
                       borderRadius: 20, borderWidth: 1.5, backgroundColor: 'transparent' },
  weatherChipEmoji:  { fontSize: 18 },
  weatherChipLabel:  { fontSize: 13, fontWeight: '500' },
  createBtn:         { backgroundColor: '#7C3AED', borderRadius: 14, padding: 16, alignItems: 'center' },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});