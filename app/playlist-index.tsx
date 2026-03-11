// app/playlist-index.tsx
import { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, TextInput, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Playlist, WEATHER_MOODS, loadPlaylists, createPlaylist, deletePlaylist } from '../storage/playlist';
import { global } from '../styles/global';
import { colors, spacing, radius, text } from '../styles/theme';

export default function PlaylistsPage() {
  const [playlists,       setPlaylists] = useState<Playlist[]>([]);
  const [modalVisible,    setModal]     = useState(false);
  const [newName,         setNewName]   = useState('');
  const [selectedWeather, setWeather]   = useState<string | null>(null);

  const load = useCallback(async () => { setPlaylists(await loadPlaylists()); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleCreate() {
    if (!newName.trim()) return;
    await createPlaylist(newName.trim(), selectedWeather);
    setNewName(''); setWeather(null); setModal(false); load();
  }

  async function handleDelete(id: string) {
    Alert.alert('Supprimer', 'Supprimer cette playlist ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await deletePlaylist(id); load(); } },
    ]);
  }

  const getWeather = (id: string | null) => WEATHER_MOODS.find(w => w.id === id);

  return (
    <View style={[global.screen, { paddingTop: 60 }]}>
      <Text style={global.headerTitle}>🎶 Mes Playlists</Text>

      <FlatList
        data={playlists}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={global.empty}>
            <Text style={global.emptyEmoji}>🎵</Text>
            <Text style={global.emptyText}>Aucune playlist pour l'instant</Text>
            <Text style={global.emptyHint}>Appuie sur + pour en créer une</Text>
          </View>
        }
        renderItem={({ item }) => {
          const weather = getWeather(item.weatherId);
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/playlists-detail?id=${item.id}`)}>
              <View style={[styles.weatherBadge, { backgroundColor: weather ? weather.color + '33' : colors.border }]}>
                <Text style={{ fontSize: 24 }}>{weather ? weather.emoji : '🎵'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={global.textMuted}>
                  {item.tracks.length} morceau{item.tracks.length !== 1 ? 'x' : ''}
                  {weather ? `  ·  ${weather.label}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => handleDelete(item.id)} style={{ padding: 6 }}>
                <Text style={{ fontSize: 18 }}>🗑️</Text>
              </Pressable>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        }}
      />

      <Pressable style={global.fab} onPress={() => setModal(true)}>
        <Text style={global.fabText}>+</Text>
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={global.overlay} onPress={() => setModal(false)} />
        <View style={global.sheet}>
          <Text style={global.sheetTitle}>Nouvelle playlist</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom de la playlist..."
            placeholderTextColor={colors.textMuted}
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />
          <Text style={global.sheetLabel}>Ambiance météo (optionnel)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
            {WEATHER_MOODS.map(w => (
              <Pressable
                key={w.id}
                onPress={() => setWeather(selectedWeather === w.id ? null : w.id)}
                style={[styles.weatherChip, { borderColor: w.color }, selectedWeather === w.id && { backgroundColor: w.color + '44' }]}
              >
                <Text style={{ fontSize: 18 }}>{w.emoji}</Text>
                <Text style={[{ fontSize: text.md, fontWeight: '500' }, { color: w.color }]}>{w.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            style={[global.btnFull, !newName.trim() && global.btnDisabled]}
            onPress={handleCreate}
            disabled={!newName.trim()}
          >
            <Text style={global.btnText}>Créer la playlist</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  list:        { padding: spacing.lg, gap: spacing.md, paddingBottom: 100 },
  card:        { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14 },
  weatherBadge:{ width: 48, height: 48, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  cardName:    { color: '#fff', fontSize: text.lg, fontWeight: '600' },
  chevron:     { color: colors.textDisabled, fontSize: 24 },
  input:       { backgroundColor: colors.bg, color: '#fff', borderRadius: radius.md, padding: 14, fontSize: text.lg, borderWidth: 1, borderColor: colors.border },
  weatherChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1.5, backgroundColor: 'transparent' },
});