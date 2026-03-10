// app/Music.tsx
import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, Pressable, ActivityIndicator,
  StyleSheet, Image, TextInput, ScrollView
} from 'react-native';
import { Audio } from 'expo-av';
import {
  useInfiniteQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

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
const PAGE_SIZE = 200; // max autorisé par Jamendo

const GENRES = ['Tous', 'rock', 'pop', 'jazz', 'electronic', 'classical', 'hiphop', 'metal', 'folk'];

const SORT_OPTIONS: SortOption[] = [
  { label: '🔥 Popularité', value: 'popularity_total' },
  { label: '🆕 Récent',     value: 'releasedate' },
  { label: '🔀 Aléatoire',  value: 'buzzrate' },
];

// ─── Fetch paginé ─────────────────────────────────────────────────────────────
async function fetchPage(genre: string, order: string, offset: number): Promise<Track[]> {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    format:    'json',
    limit:     String(PAGE_SIZE),
    offset:    String(offset),   // ← clé de la pagination
    imagesize: '200',
    order,
  });
  if (genre !== 'Tous') params.append('tags', genre);

  const res  = await fetch(`${BASE}/tracks?${params}`);
  const data = await res.json();
  return data.results ?? [];
}

// ─── QueryClient (une seule instance) ────────────────────────────────────────
const queryClient = new QueryClient();

// ─── Composant interne (a accès au QueryClient) ───────────────────────────────
function MusicPageInner() {
  const [genre,  setGenre]  = useState('Tous');
  const [order,  setOrder]  = useState('popularity_total');
  const [search, setSearch] = useState('');
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [playingId,    setPlayingId]    = useState<string | null>(null);

  // ── Pagination infinie ──────────────────────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey:           ['tracks', genre, order],
    queryFn:            ({ pageParam = 0 }) => fetchPage(genre, order, pageParam),
    // pageParam suivant = offset actuel + PAGE_SIZE
    // si la page retourne moins de PAGE_SIZE résultats → fin du catalogue
    getNextPageParam:   (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
    initialPageParam:   0,
    staleTime:          1000 * 60 * 10, // cache 10 min
  });

  // Aplatir toutes les pages en une seule liste
  const allTracks = useMemo(
    () => data?.pages.flat() ?? [],
    [data]
  );

  // Filtre local par recherche
  const filtered = useMemo(() =>
    search.trim() === ''
      ? allTracks
      : allTracks.filter(t =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.artist_name.toLowerCase().includes(search.toLowerCase())
        ),
    [allTracks, search]
  );

  // ── Audio ───────────────────────────────────────────────────────────────────
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

  // ── Rendu ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      <Text style={styles.header}>🎵 Jamendo</Text>

      {/* Compteur de tracks chargés */}
      <Text style={styles.counter}>
        {allTracks.length.toLocaleString()} titres chargés
      </Text>

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
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {GENRES.map(g => (
          <Pressable
            key={g}
            style={[styles.chip, genre === g && styles.chipActive]}
            onPress={() => setGenre(g)}
          >
            <Text style={[styles.chipText, genre === g && styles.chipTextActive]}>{g}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Tri ── */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map(opt => (
          <Pressable
            key={opt.value}
            style={[styles.sortBtn, order === opt.value && styles.sortBtnActive]}
            onPress={() => setOrder(opt.value)}
          >
            <Text style={[styles.sortText, order === opt.value && styles.sortTextActive]}>
              {opt.label}
            </Text>
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
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}

          // ── Pagination infinie : charge la page suivante en fin de liste ──
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3} // déclenche à 30% avant la fin

          // ── Spinner en bas pendant le chargement de la page suivante ──
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator color="#7C3AED" style={{ marginVertical: 16 }} />
              : hasNextPage
                ? <Text style={styles.loadMore}>↓ Scroll pour charger plus</Text>
                : allTracks.length > 0
                  ? <Text style={styles.endText}>✓ {allTracks.length.toLocaleString()} titres chargés</Text>
                  : null
          }

          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune musique trouvée 😕</Text>
            </View>
          }

          renderItem={({ item }) => {
            const isPlaying = playingId === item.id;
            return (
              <Pressable
                style={[styles.card, isPlaying && styles.cardActive]}
                onPress={() => togglePlay(item)}
              >
                <Image source={{ uri: item.album_image }} style={styles.cover} />
                <View style={styles.info}>
                  <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.artist}    numberOfLines={1}>{item.artist_name}</Text>
                </View>
                <Text style={styles.icon}>{isPlaying ? '⏹' : '▶️'}</Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

// ─── Export avec QueryClientProvider ─────────────────────────────────────────
export default function MusicPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <MusicPageInner />
    </QueryClientProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0F0F1A', paddingTop: 60 },
  header:         { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
  counter:        { color: '#6B7280', fontSize: 12, textAlign: 'center', marginBottom: 12 },

  searchBox:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E2E',
                    marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon:     { fontSize: 16, marginRight: 8 },
  searchInput:    { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 12 },
  clearBtn:       { color: '#6B7280', fontSize: 16, paddingLeft: 8 },

  filterRow:      { marginBottom: 12, flexGrow: 0 },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                    backgroundColor: '#1E1E2E', borderWidth: 1, borderColor: '#2D2D40' },
  chipActive:     { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  chipText:       { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#fff' },

  sortRow:        { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  sortBtn:        { flex: 1, paddingVertical: 8, borderRadius: 10,
                    backgroundColor: '#1E1E2E', alignItems: 'center' },
  sortBtnActive:  { backgroundColor: '#3B1F6E', borderWidth: 1, borderColor: '#7C3AED' },
  sortText:       { color: '#9CA3AF', fontSize: 12, fontWeight: '500' },
  sortTextActive: { color: '#A78BFA' },

  list:           { padding: 16, gap: 12 },
  card:           { flexDirection: 'row', alignItems: 'center', gap: 12,
                    backgroundColor: '#1E1E2E', borderRadius: 12, padding: 12 },
  cardActive:     { backgroundColor: '#3B1F6E', borderColor: '#7C3AED', borderWidth: 1 },
  cover:          { width: 56, height: 56, borderRadius: 8 },
  info:           { flex: 1 },
  trackName:      { color: '#fff', fontWeight: '600', fontSize: 15 },
  artist:         { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  icon:           { fontSize: 22 },

  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loading:        { color: '#9CA3AF', fontSize: 16 },
  empty:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:      { color: '#6B7280', fontSize: 16 },
  loadMore:       { color: '#4B5563', fontSize: 13, textAlign: 'center', marginVertical: 12 },
  endText:        { color: '#22C55E', fontSize: 13, textAlign: 'center', marginVertical: 12 },
});