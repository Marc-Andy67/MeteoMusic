// app/Music.tsx
import { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet, Image, TextInput, ScrollView, Modal, Alert } from 'react-native';
import { useInfiniteQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WEATHER_MOODS, addTrackToPlaylist, removeTrackFromPlaylist, Track } from '../storage/playlist';
import { GENRES, SORT_OPTIONS, fetchJamendoPage, JAMENDO_PAGE_SIZE } from '../constants/jamendo';
import { usePreviewPlayer } from '../hooks/usePreviewPlayer';
import { usePlaylistManager } from '../hooks/usePlaylistManager';
import { global } from '../styles/global';
import { colors, spacing, radius, text } from '../styles/theme';

const queryClient = new QueryClient();

function MusicPageInner() {
  const [genre,  setGenre]  = useState('Tous');
  const [order,  setOrder]  = useState('popularity_total');
  const [search, setSearch] = useState('');

  const { playingId, togglePlay } = usePreviewPlayer();
  const { playlists, reload: reloadPlaylists } = usePlaylistManager();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [playlistModal, setPlaylistModal] = useState(false);

  useEffect(() => { reloadPlaylists(); }, [reloadPlaylists]);

  function openPlaylistModal(track: Track) { setSelectedTrack(track); reloadPlaylists(); setPlaylistModal(true); }
  function closePlaylistModal() { setPlaylistModal(false); setSelectedTrack(null); reloadPlaylists(); }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey:         ['tracks', genre, order, search],
    queryFn:          ({ pageParam = 0 }) => fetchJamendoPage(genre, order, pageParam, search),
    getNextPageParam: (lastPage, allPages) => lastPage.length < JAMENDO_PAGE_SIZE ? undefined : allPages.length * JAMENDO_PAGE_SIZE,
    initialPageParam: 0,
    staleTime:        1000 * 60 * 10,
  });

  const allTracks = useMemo(() => data?.pages.flat() ?? [], [data]);

  async function handleAddToPlaylist(pl: { id: string }) {
    if (!selectedTrack) return;
    await addTrackToPlaylist(pl.id, selectedTrack);
    reloadPlaylists();
  }

  async function handleRemoveFromPlaylist(playlistId: string) {
    if (!selectedTrack) return;
    Alert.alert('Retirer', 'Retirer ce morceau de la playlist ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: async () => { await removeTrackFromPlaylist(playlistId, selectedTrack.id); reloadPlaylists(); } },
    ]);
  }

  const getWeather = (id: string | null) => WEATHER_MOODS.find(w => w.id === id);

  // ── Header fixe dans la FlatList — empêche les chips de rétrécir ────────────
  const ListHeader = (
    <View>
      <Text style={global.headerTitle}>🎵 Jamendo</Text>
      <Text style={[global.textMuted, { textAlign: 'center', fontSize: text.xs, marginBottom: spacing.md }]}>
        {allTracks.length.toLocaleString()} titres chargés
      </Text>

      {/* ── Recherche ── */}
      <View style={[global.searchBox, { marginHorizontal: spacing.lg, marginBottom: spacing.md }]}>
        <Text style={global.searchIcon}>🔍</Text>
        <TextInput
          style={global.searchInput}
          placeholder="Rechercher un titre, un artiste..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Text style={global.clearBtn}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* ── Genres — chips plus grands ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: spacing.md }}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
      >
        {GENRES.map(g => (
          <Pressable
            key={g}
            style={[styles.genreChip, g === genre && styles.genreChipActive]}
            onPress={() => setGenre(g)}
          >
            <Text style={[styles.genreChipText, g === genre && styles.genreChipTextActive]}>
              {g}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Tri ── */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map(o => (
          <Pressable
            key={o.value}
            style={[styles.sortBtn, order === o.value && styles.sortBtnActive]}
            onPress={() => setOrder(o.value)}
          >
            <Text style={[styles.sortText, order === o.value && styles.sortTextActive]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[global.screen, { paddingTop: 60 }]}>
      {isLoading ? (
        <>
          {ListHeader}
          <View style={global.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={global.textSecondary}>Chargement...</Text>
          </View>
        </>
      ) : allTracks.length === 0 ? (
        <>
          {ListHeader}
          <View style={global.empty}><Text style={global.textMuted}>Aucun résultat</Text></View>
        </>
      ) : (
        <FlatList
          data={allTracks}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={ListHeader}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
              : hasNextPage
                ? <Text style={[global.textMuted, { textAlign: 'center', marginVertical: spacing.md }]}>Défiler pour charger plus</Text>
                : <Text style={{ color: colors.success, textAlign: 'center', marginVertical: spacing.md, fontSize: text.md }}>✓ Tous les titres chargés</Text>
          }
          renderItem={({ item }) => {
            const isPlaying           = playingId === item.id;
            const playlistsContaining = playlists.filter(p => p.tracks.some(t => t.id === item.id));
            const isInAny             = playlistsContaining.length > 0;
            return (
              <View style={[styles.card, isPlaying && styles.cardActive]}>
                <Pressable style={styles.cardLeft} onPress={() => togglePlay(item)}>
                  <Image source={{ uri: item.album_image }} style={global.coverMd} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                    <Text style={global.textSecondary} numberOfLines={1}>{item.artist_name}</Text>
                  </View>
                  <Text style={{ fontSize: 20 }}>{isPlaying ? '⏹' : '▶️'}</Text>
                </Pressable>
                <Pressable style={[styles.addBtn, isInAny && styles.addBtnDone]} onPress={() => openPlaylistModal(item)}>
                  <Text style={[styles.addBtnIcon, isInAny && { color: colors.success }]}>{isInAny ? '✓' : '+'}</Text>
                  {isInAny && <Text style={{ color: colors.success, fontSize: text.xs }}>{playlistsContaining.length}</Text>}
                </Pressable>
              </View>
            );
          }}
        />
      )}

      {/* ── Modal playlists ── */}
      <Modal visible={playlistModal} transparent animationType="slide">
        <Pressable style={global.overlay} onPress={closePlaylistModal} />
        <View style={global.sheet}>
          {selectedTrack && (
            <View style={styles.sheetTrack}>
              <Image source={{ uri: selectedTrack.album_image }} style={global.coverSm} />
              <View style={{ flex: 1 }}>
                <Text style={[global.textPrimary, { fontWeight: '600' }]} numberOfLines={1}>{selectedTrack.name}</Text>
                <Text style={global.textSecondary} numberOfLines={1}>{selectedTrack.artist_name}</Text>
              </View>
            </View>
          )}
          <Text style={global.sheetLabel}>Mes playlists</Text>
          {playlists.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.xl, gap: 6 }}>
              <Text style={global.textSecondary}>Aucune playlist créée</Text>
              <Text style={global.textMuted}>Crée une playlist dans l'onglet 🎶</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 340 }}>
              {playlists.map(pl => {
                const weather = getWeather(pl.weatherId);
                const isAdded = pl.tracks.some(t => t.id === selectedTrack?.id);
                return (
                  <View key={pl.id} style={styles.plRow}>
                    <Pressable style={[styles.plCard, isAdded && { opacity: 0.7 }]} onPress={() => !isAdded && handleAddToPlaylist(pl)}>
                      <View style={[styles.plBadge, { backgroundColor: weather ? weather.color + '33' : colors.border }]}>
                        <Text style={{ fontSize: 20 }}>{weather ? weather.emoji : '🎵'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[global.textPrimary, { fontWeight: '600' }]}>{pl.name}</Text>
                        <Text style={global.textMuted}>{pl.tracks.length} morceau{pl.tracks.length !== 1 ? 'x' : ''}{weather ? `  ·  ${weather.label}` : ''}</Text>
                      </View>
                      <Text style={[styles.plAddIcon, isAdded && { color: colors.success }]}>{isAdded ? '✓' : '+'}</Text>
                    </Pressable>
                    {isAdded && (
                      <Pressable style={{ padding: spacing.md }} onPress={() => handleRemoveFromPlaylist(pl.id)}>
                        <Text style={{ color: colors.error, fontSize: text.lg, fontWeight: 'bold' }}>✕</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
          <Pressable style={styles.closeBtn} onPress={closePlaylistModal}>
            <Text style={[global.textSecondary, { fontWeight: '600' }]}>Fermer</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

export default function MusicPage() {
  return <QueryClientProvider client={queryClient}><MusicPageInner /></QueryClientProvider>;
}

const styles = StyleSheet.create({
  // ── Genre chips — plus grands et plus lisibles ──
  genreChip:      {
    paddingHorizontal: 18,
    paddingVertical:   10,
    borderRadius:      radius.full,
    backgroundColor:   colors.card,
    borderWidth:       1.5,
    borderColor:       colors.border,
  },
  genreChipActive: {
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
  },
  genreChipText:  {
    color:      colors.textSecondary,
    fontSize:   text.base,   // 15px au lieu de 13
    fontWeight: '600',
  },
  genreChipTextActive: {
    color: colors.textPrimary,
  },

  // ── Tri ──
  sortRow:       { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sortBtn:       { flex: 1, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: colors.card, alignItems: 'center' },
  sortBtnActive: { backgroundColor: colors.primaryDim, borderWidth: 1, borderColor: colors.primary },
  sortText:      { color: colors.textSecondary, fontSize: text.md, fontWeight: '500' },
  sortTextActive:{ color: colors.primaryText },

  // ── Liste ──
  list:          { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  card:          { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' },
  cardActive:    { borderWidth: 1, borderColor: colors.primary, backgroundColor: '#2D1B4E' },
  cardLeft:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  trackName:     { color: '#fff', fontWeight: '600', fontSize: text.base },
  addBtn:        { width: 44, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: colors.border, gap: 2 },
  addBtnDone:    { backgroundColor: '#0F1F0F' },
  addBtnIcon:    { color: colors.primary, fontSize: 20, fontWeight: 'bold' },

  // ── Modal ──
  sheetTrack:    { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.md },
  plRow:         { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  plCard:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  plBadge:       { width: 44, height: 44, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center' },
  plAddIcon:     { color: colors.primary, fontSize: 22, fontWeight: 'bold', width: 28, textAlign: 'center' },
  closeBtn:      { backgroundColor: colors.border, borderRadius: radius.md, padding: 14, alignItems: 'center' },
});