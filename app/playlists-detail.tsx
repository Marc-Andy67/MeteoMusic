// app/playlists-detail.tsx
import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Pressable, Modal, StyleSheet, Image, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Playlist, Track, WEATHER_MOODS, loadPlaylists, addTrackToPlaylist, removeTrackFromPlaylist } from '../storage/playlist';
import { usePlayer } from '../context/PlayerContext';
import { usePreviewPlayer } from '../hooks/usePreviewPlayer';
import { fetchJamendoPage } from '../constants/jamendo';
import { global } from '../styles/global';
import { colors, spacing, radius, text } from '../styles/theme';

export default function PlaylistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const player  = usePlayer();

  const [playlist,   setPlaylist]  = useState<Playlist | null>(null);
  const [addModal,   setAddModal]  = useState(false);
  const [jamTracks,  setJamTracks] = useState<Track[]>([]);
  const [jamLoading, setJamLoading]= useState(false);
  const [jamSearch,  setJamSearch] = useState('');

  const { playingId, togglePlay, stopPreview } = usePreviewPlayer();

  const load = useCallback(async () => {
    const all = await loadPlaylists();
    setPlaylist(all.find(p => p.id === id) ?? null);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handlePlayPlaylist(startIndex = 0) {
    if (!playlist || playlist.tracks.length === 0) return;
    await stopPreview();
    await player.playPlaylist(playlist.tracks, playlist.name, startIndex);
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
    try {
      setJamTracks(await fetchJamendoPage('Tous', 'popularity_total', 0));
    } catch (e) {
      console.error('Jamendo fetch error:', e);
    } finally {
      setJamLoading(false);
    }
  }

  async function handleAdd(track: Track) {
    if (!playlist) return;
    await addTrackToPlaylist(playlist.id, track);
    load();
  }

  if (!playlist) return (
    <View style={global.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  );

  const weather         = WEATHER_MOODS.find(w => w.id === playlist.weatherId);
  const filteredJam     = jamSearch.trim() === '' ? jamTracks : jamTracks.filter(t =>
    t.name.toLowerCase().includes(jamSearch.toLowerCase()) || t.artist_name.toLowerCase().includes(jamSearch.toLowerCase())
  );
  const isActivePlaylist = player.queue.length > 0 && player.queue[0]?.id === playlist.tracks[0]?.id;

  return (
    <View style={[global.screen, { paddingTop: 60 }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={{ paddingTop: 4 }}>
          <Text style={{ color: colors.primary, fontSize: 36, lineHeight: 36 }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[global.textPrimary, { fontSize: text.h2, fontWeight: 'bold' }]}>{playlist.name}</Text>
          {weather && (
            <View style={[styles.weatherTag, { backgroundColor: weather.color + '33' }]}>
              <Text style={{ fontSize: 16 }}>{weather.emoji}</Text>
              <Text style={[{ fontSize: text.md, fontWeight: '600' }, { color: weather.color }]}>{weather.label}</Text>
            </View>
          )}
          <Text style={global.textMuted}>{playlist.tracks.length} morceau{playlist.tracks.length !== 1 ? 'x' : ''}</Text>
        </View>
      </View>

      {/* ── Barre de lecture ── */}
      {playlist.tracks.length > 0 && (
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          {isActivePlaylist ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Pressable onPress={player.prevTrack} style={[styles.ctrlBtn, player.currentIndex === 0 && { opacity: 0.3 }]} disabled={player.currentIndex === 0}>
                <Text style={{ fontSize: 24, color: colors.textSecondary }}>⏮</Text>
              </Pressable>
              <Pressable onPress={player.togglePause} style={styles.playBtnLarge}>
                <Text style={{ fontSize: 18, color: '#fff' }}>{player.isPlaying ? '⏸' : '▶'}</Text>
                <Text style={[global.btnText, { fontWeight: '700' }]}>{player.isPlaying ? 'En lecture' : 'En pause'}</Text>
              </Pressable>
              <Pressable onPress={player.nextTrack} style={[styles.ctrlBtn, player.currentIndex >= player.queue.length - 1 && { opacity: 0.3 }]} disabled={player.currentIndex >= player.queue.length - 1}>
                <Text style={{ fontSize: 24, color: colors.textSecondary }}>⏭</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.playBtnLarge} onPress={() => handlePlayPlaylist(0)}>
              <Text style={{ fontSize: 18, color: '#fff' }}>▶</Text>
              <Text style={[global.btnText, { fontWeight: '700' }]}>Lire la playlist</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── Tracks ── */}
      <FlatList
        data={playlist.tracks}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={global.empty}>
            <Text style={global.emptyEmoji}>🎵</Text>
            <Text style={global.emptyText}>Aucun morceau</Text>
            <Text style={global.emptyHint}>Appuie sur + pour en ajouter</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isPlaying       = playingId === item.id;
          const isGlobalPlaying = isActivePlaylist && player.currentIndex === index;
          return (
            <View style={[styles.trackCard, isPlaying && styles.trackCardActive, isGlobalPlaying && styles.trackCardGlobal]}>
              <Text style={{ color: colors.textDisabled, fontSize: text.sm, width: 28, textAlign: 'center' }}>{index + 1}</Text>
              <Pressable style={styles.trackLeft} onPress={() => togglePlay(item)}>
                <Image source={{ uri: item.album_image }} style={global.coverSm} />
                <View style={{ flex: 1 }}>
                  <Text style={[global.textPrimary, { fontWeight: '600', fontSize: text.md }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={global.textSecondary} numberOfLines={1}>{item.artist_name}</Text>
                </View>
                <Text style={{ fontSize: 18 }}>{isPlaying ? '⏹' : '▶️'}</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => handlePlayPlaylist(index)}>
                <Text style={{ color: colors.primary, fontSize: 14 }}>▶</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => handleRemove(item.id)}>
                <Text style={{ color: colors.error, fontSize: 14, fontWeight: 'bold' }}>✕</Text>
              </Pressable>
            </View>
          );
        }}
      />

      <Pressable style={global.fab} onPress={openAddModal}>
        <Text style={global.fabText}>+</Text>
      </Pressable>

      {/* ── Modal Jamendo ── */}
      <Modal visible={addModal} transparent animationType="slide">
        <Pressable style={global.overlay} onPress={() => { setAddModal(false); setJamSearch(''); }} />
        <View style={global.sheet}>
          <Text style={global.sheetTitle}>Ajouter depuis Jamendo</Text>
          <View style={[global.searchBox, { backgroundColor: colors.bg }]}>
            <Text style={[global.searchIcon, { fontSize: 14 }]}>🔍</Text>
            <TextInput style={[global.searchInput, { fontSize: text.md }]} placeholder="Rechercher..." placeholderTextColor={colors.textMuted} value={jamSearch} onChangeText={setJamSearch} />
            {jamSearch.length > 0 && <Pressable onPress={() => setJamSearch('')}><Text style={global.clearBtn}>✕</Text></Pressable>}
          </View>
          {jamLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <ScrollView style={{ maxHeight: 380 }}>
              {filteredJam.map(track => {
                const alreadyIn = playlist.tracks.some(t => t.id === track.id);
                return (
                  <View key={track.id} style={styles.jamRow}>
                    <Pressable style={[styles.jamCard, alreadyIn && { opacity: 0.6 }]} onPress={() => !alreadyIn && handleAdd(track)}>
                      <Image source={{ uri: track.album_image }} style={global.coverSm} />
                      <View style={{ flex: 1 }}>
                        <Text style={[global.textPrimary, { fontWeight: '600', fontSize: text.md }]} numberOfLines={1}>{track.name}</Text>
                        <Text style={global.textSecondary} numberOfLines={1}>{track.artist_name}</Text>
                      </View>
                      <Text style={[{ color: colors.primary, fontSize: 22, fontWeight: 'bold', width: 28, textAlign: 'center' }, alreadyIn && { color: colors.success }]}>
                        {alreadyIn ? '✓' : '+'}
                      </Text>
                    </Pressable>
                    {alreadyIn && (
                      <Pressable style={{ padding: spacing.md }} onPress={() => handleRemove(track.id)}>
                        <Text style={{ color: colors.error, fontSize: text.lg, fontWeight: 'bold' }}>✕</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header:          { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  weatherTag:      { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  ctrlBtn:         { padding: 10 },
  playBtnLarge:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 14 },
  trackCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' },
  trackCardActive: { borderWidth: 1, borderColor: colors.primary, backgroundColor: '#2D1B4E' },
  trackCardGlobal: { borderWidth: 1, borderColor: colors.success, backgroundColor: '#0F2010' },
  trackLeft:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  actionBtn:       { padding: spacing.md, borderLeftWidth: 1, borderLeftColor: colors.border },
  jamRow:          { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  jamCard:         { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10 },
});