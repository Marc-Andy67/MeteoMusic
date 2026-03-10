// app/Music.tsx
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, FlatList, Pressable, ActivityIndicator,
  StyleSheet, Image, TextInput, ScrollView, Modal, Alert
} from 'react-native';
import { Audio } from 'expo-av';
import {
  useInfiniteQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  Playlist, WEATHER_MOODS,
  loadPlaylists, addTrackToPlaylist, removeTrackFromPlaylist
} from '../storage/playlist';

// ─── Types ────────────────────────────────────────────────────────────────────
type Track = {
  id: string;
  name: string;
  artist_name: string;
  album_image: string;
  audio: string;
};

type SortOption = { label: string; value: string };

// ─── Config ───────────────────────────────────────────────────────────────────
const CLIENT_ID = 'c3e93b7e';
const BASE      = 'https://api.jamendo.com/v3.0';
const PAGE_SIZE = 200;

const GENRES = ['Tous', 'rock', 'pop', 'jazz', 'electronic', 'classical', 'hiphop', 'metal', 'folk'];

const SORT_OPTIONS: SortOption[] = [
  { label: '🔥 Popularité', value: 'popularity_total' },
  { label: '🆕 Récent',     value: 'releasedate' },
  { label: '🔀 Aléatoire',  value: 'buzzrate' },
];

// ─── Fetch paginé ─────────────────────────────────────────────────────────────
async function fetchPage(genre: string, order: string, offset: number, search: string): Promise<Track[]> {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    format:    'json',
    limit:     String(PAGE_SIZE),
    offset:    String(offset),
    imagesize: '200',
    order,
  });
  if (genre !== 'Tous') params.append('tags', genre);
  if (search.trim())    params.append('namesearch', search);
  const res  = await fetch(`${BASE}/tracks?${params}`);
  const data = await res.json();
  return data.results ?? [];
}

const queryClient = new QueryClient();

// ─── Composant interne ────────────────────────────────────────────────────────
function MusicPageInner() {
  const [genre,  setGenre]  = useState('Tous');
  const [order,  setOrder]  = useState('popularity_total');
  const [search, setSearch] = useState('');
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [playingId,    setPlayingId]    = useState<string | null>(null);

  // ── Playlists — toujours lues depuis AsyncStorage, jamais de cache local ──
  const [playlists,     setPlaylists]     = useState<Playlist[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [playlistModal, setPlaylistModal] = useState(false);

  const reloadPlaylists = useCallback(async () => {
    setPlaylists(await loadPlaylists());
  }, []);

  // Charge au montage
  useEffect(() => { reloadPlaylists(); }, [reloadPlaylists]);

  function openPlaylistModal(track: Track) {
    setSelectedTrack(track);
    reloadPlaylists(); // ← recharge à chaque ouverture → voit les suppressions
    setPlaylistModal(true);
  }

  function closePlaylistModal() {
    setPlaylistModal(false);
    setSelectedTrack(null);
    reloadPlaylists(); // ← recharge à la fermeture → met à jour les ✓ sur les cartes
  }

  // ── Pagination infinie ────────────────────────────────────────────────────
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey:         ['tracks', genre, order, search],
      queryFn:          ({ pageParam = 0 }) => fetchPage(genre, order, pageParam, search),
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
      initialPageParam: 0,
      staleTime:        1000 * 60 * 10,
    });

  const allTracks = useMemo(() => data?.pages.flat() ?? [], [data]);

  // ── Audio ─────────────────────────────────────────────────────────────────
  const togglePlay = useCallback(async (track: Track) => {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      setCurrentSound(null);
      if (playingId === track.id) { setPlayingId(null); return; }
    }
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync({ uri: track.audio });
    setCurrentSound(sound);
    setPlayingId(track.id);
    await sound.playAsync();
  }, [currentSound, playingId]);

  // ── Ajout ─────────────────────────────────────────────────────────────────
  async function handleAddToPlaylist(pl: Playlist) {
    if (!selectedTrack) return;
    await addTrackToPlaylist(pl.id, selectedTrack);
    reloadPlaylists();
  }

  // ── Suppression depuis le modal ───────────────────────────────────────────
  async function handleRemoveFromPlaylist(playlistId: string) {
    if (!selectedTrack) return;
    Alert.alert('Retirer', 'Retirer ce morceau de la playlist ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer', style: 'destructive',
        onPress: async () => {
          await removeTrackFromPlaylist(playlistId, selectedTrack.id);
          reloadPlaylists();
        }
      }
    ]);
  }

  const getWeather = (id: string | null) => WEATHER_MOODS.find(w => w.id === id);

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🎵 Jamendo</Text>
      <Text style={styles.counter}>{allTracks.length.toLocaleString()} titres chargés</Text>

      {/* ── Recherche ── */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un titre, un artiste..."
          placeholderTextColor="#6B7280"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* ── Genres ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {GENRES.map(g => (
          <Pressable key={g} style={[styles.chip, genre === g && styles.chipActive]} onPress={() => setGenre(g)}>
            <Text style={[styles.chipText, genre === g && styles.chipTextActive]}>{g}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Tri ── */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map(opt => (
          <Pressable key={opt.value}
            style={[styles.sortBtn, order === opt.value && styles.sortBtnActive]}
            onPress={() => setOrder(opt.value)}>
            <Text style={[styles.sortText, order === opt.value && styles.sortTextActive]}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* ── Liste ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loading}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={allTracks}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator color="#7C3AED" style={{ marginVertical: 16 }} />
              : hasNextPage
                ? <Text style={styles.loadMore}>↓ Scroll pour charger plus</Text>
                : allTracks.length > 0
                  ? <Text style={styles.endText}>✓ {allTracks.length.toLocaleString()} titres</Text>
                  : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune musique trouvée 😕</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isPlaying = playingId === item.id;
            // Lecture directe depuis playlists → jamais de cache périmé
            const playlistsContaining = playlists.filter(p => p.tracks.some(t => t.id === item.id));
            const isInAny = playlistsContaining.length > 0;

            return (
              <View style={[styles.card, isPlaying && styles.cardActive]}>
                <Pressable style={styles.cardLeft} onPress={() => togglePlay(item)}>
                  <Image source={{ uri: item.album_image }} style={styles.cover} />
                  <View style={styles.info}>
                    <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.artist}    numberOfLines={1}>{item.artist_name}</Text>
                  </View>
                  <Text style={styles.playIcon}>{isPlaying ? '⏹' : '▶️'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.addBtn, isInAny && styles.addBtnDone]}
                  onPress={() => openPlaylistModal(item)}
                >
                  <Text style={[styles.addBtnIcon, isInAny && { color: '#22C55E' }]}>
                    {isInAny ? '✓' : '+'}
                  </Text>
                  {isInAny && <Text style={styles.addBtnCount}>{playlistsContaining.length}</Text>}
                </Pressable>
              </View>
            );
          }}
        />
      )}

      {/* ── Modal playlists ── */}
      <Modal visible={playlistModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={closePlaylistModal} />
        <View style={styles.sheet}>

          {selectedTrack && (
            <View style={styles.sheetTrack}>
              <Image source={{ uri: selectedTrack.album_image }} style={styles.sheetCover} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTrackName} numberOfLines={1}>{selectedTrack.name}</Text>
                <Text style={styles.sheetTrackArtist} numberOfLines={1}>{selectedTrack.artist_name}</Text>
              </View>
            </View>
          )}

          <Text style={styles.sheetLabel}>Mes playlists</Text>

          {playlists.length === 0 ? (
            <View style={styles.noPlaylist}>
              <Text style={styles.noPlaylistText}>Aucune playlist créée</Text>
              <Text style={styles.noPlaylistHint}>Crée une playlist dans l'onglet 🎶</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 340 }}>
              {playlists.map(pl => {
                const weather = getWeather(pl.weatherId);
                // Toujours lu depuis le state playlists rechargé depuis AsyncStorage
                const isAdded = pl.tracks.some(t => t.id === selectedTrack?.id);
                return (
                  <View key={pl.id} style={styles.plRow}>
                    <Pressable
                      style={[styles.plCard, isAdded && styles.plCardAdded]}
                      onPress={() => !isAdded && handleAddToPlaylist(pl)}
                    >
                      <View style={[styles.plBadge, { backgroundColor: weather ? weather.color + '33' : '#2D2D40' }]}>
                        <Text style={{ fontSize: 20 }}>{weather ? weather.emoji : '🎵'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.plName}>{pl.name}</Text>
                        <Text style={styles.plMeta}>
                          {pl.tracks.length} morceau{pl.tracks.length !== 1 ? 'x' : ''}
                          {weather ? `  ·  ${weather.label}` : ''}
                        </Text>
                      </View>
                      <Text style={[styles.plAddIcon, isAdded && { color: '#22C55E' }]}>
                        {isAdded ? '✓' : '+'}
                      </Text>
                    </Pressable>

                    {/* Bouton retirer — visible seulement si présent dans cette playlist */}
                    {isAdded && (
                      <Pressable style={styles.plRemoveBtn} onPress={() => handleRemoveFromPlaylist(pl.id)}>
                        <Text style={styles.plRemoveIcon}>✕</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}

          <Pressable style={styles.closeBtn} onPress={closePlaylistModal}>
            <Text style={styles.closeBtnText}>Fermer</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

export default function MusicPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <MusicPageInner />
    </QueryClientProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0F0F1A', paddingTop: 60 },
  header:           { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
  counter:          { color: '#6B7280', fontSize: 12, textAlign: 'center', marginBottom: 12 },

  searchBox:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E2E',
                      marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon:       { fontSize: 16, marginRight: 8 },
  searchInput:      { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 12 },
  clearBtn:         { color: '#6B7280', fontSize: 16, paddingLeft: 8 },

  filterRow:        { marginBottom: 12, flexGrow: 0 },
  chip:             { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                      backgroundColor: '#1E1E2E', borderWidth: 1, borderColor: '#2D2D40' },
  chipActive:       { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  chipText:         { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
  chipTextActive:   { color: '#fff' },

  sortRow:          { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  sortBtn:          { flex: 1, paddingVertical: 8, borderRadius: 10,
                      backgroundColor: '#1E1E2E', alignItems: 'center' },
  sortBtnActive:    { backgroundColor: '#3B1F6E', borderWidth: 1, borderColor: '#7C3AED' },
  sortText:         { color: '#9CA3AF', fontSize: 12, fontWeight: '500' },
  sortTextActive:   { color: '#A78BFA' },

  list:             { padding: 16, gap: 12 },
  card:             { flexDirection: 'row', alignItems: 'center',
                      backgroundColor: '#1E1E2E', borderRadius: 12, overflow: 'hidden' },
  cardActive:       { borderWidth: 1, borderColor: '#7C3AED', backgroundColor: '#2D1B4E' },
  cardLeft:         { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  cover:            { width: 52, height: 52, borderRadius: 8 },
  info:             { flex: 1 },
  trackName:        { color: '#fff', fontWeight: '600', fontSize: 15 },
  artist:           { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  playIcon:         { fontSize: 20 },

  addBtn:           { width: 44, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center',
                      borderLeftWidth: 1, borderLeftColor: '#2D2D40', gap: 2 },
  addBtnDone:       { backgroundColor: '#0F1F0F' },
  addBtnIcon:       { color: '#7C3AED', fontSize: 20, fontWeight: 'bold' },
  addBtnCount:      { color: '#22C55E', fontSize: 10 },

  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loading:          { color: '#9CA3AF', fontSize: 16 },
  empty:            { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:        { color: '#6B7280', fontSize: 16 },
  loadMore:         { color: '#4B5563', fontSize: 13, textAlign: 'center', marginVertical: 12 },
  endText:          { color: '#22C55E', fontSize: 13, textAlign: 'center', marginVertical: 12 },

  overlay:          { flex: 1, backgroundColor: '#00000088' },
  sheet:            { backgroundColor: '#1A1A2E', borderTopLeftRadius: 24, borderTopRightRadius: 24,
                      padding: 24, gap: 14 },
  sheetTrack:       { flexDirection: 'row', alignItems: 'center', gap: 12,
                      backgroundColor: '#0F0F1A', borderRadius: 12, padding: 12 },
  sheetCover:       { width: 44, height: 44, borderRadius: 8 },
  sheetTrackName:   { color: '#fff', fontWeight: '600', fontSize: 15 },
  sheetTrackArtist: { color: '#9CA3AF', fontSize: 13 },
  sheetLabel:       { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },

  noPlaylist:       { alignItems: 'center', paddingVertical: 24, gap: 6 },
  noPlaylistText:   { color: '#9CA3AF', fontSize: 16, fontWeight: '500' },
  noPlaylistHint:   { color: '#4B5563', fontSize: 13 },

  plRow:            { flexDirection: 'row', alignItems: 'center',
                      borderBottomWidth: 1, borderBottomColor: '#2D2D40' },
  plCard:           { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  plCardAdded:      { opacity: 0.7 },
  plBadge:          { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  plName:           { color: '#fff', fontSize: 15, fontWeight: '600' },
  plMeta:           { color: '#6B7280', fontSize: 12, marginTop: 2 },
  plAddIcon:        { color: '#7C3AED', fontSize: 22, fontWeight: 'bold', width: 28, textAlign: 'center' },
  plRemoveBtn:      { padding: 12 },
  plRemoveIcon:     { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },

  closeBtn:         { backgroundColor: '#2D2D40', borderRadius: 12, padding: 14, alignItems: 'center' },
  closeBtnText:     { color: '#9CA3AF', fontSize: 15, fontWeight: '600' },
});