// components/MiniPlayer.tsx
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '../context/PlayerContext';

export default function MiniPlayer() {
  const {
    currentTrack, isPlaying, playlistName,
    togglePause, nextTrack, prevTrack,
    currentIndex, queue, stopPlayer
  } = usePlayer();

  const insets = useSafeAreaInsets();

  if (!currentTrack) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < queue.length - 1;
  const progress = ((currentIndex + 1) / queue.length) * 100;

  return (
    <View style={[styles.container, { top: insets.top }]}>
      <View style={styles.inner}>

        {/* Cover + infos */}
        <Image source={{ uri: currentTrack.album_image }} style={styles.cover} />
        <View style={styles.info}>
          <Text style={styles.trackName} numberOfLines={1}>{currentTrack.name}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {playlistName}  ·  {currentIndex + 1}/{queue.length}
          </Text>
        </View>

        {/* Contrôles */}
        <View style={styles.controls}>
          <Pressable
            onPress={prevTrack}
            style={[styles.ctrlBtn, !hasPrev && styles.ctrlDisabled]}
            disabled={!hasPrev}
          >
            <Text style={styles.ctrlIcon}>⏮</Text>
          </Pressable>

          <Pressable onPress={togglePause} style={styles.playBtn}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
          </Pressable>

          <Pressable
            onPress={nextTrack}
            style={[styles.ctrlBtn, !hasNext && styles.ctrlDisabled]}
            disabled={!hasNext}
          >
            <Text style={styles.ctrlIcon}>⏭</Text>
          </Pressable>

          <Pressable onPress={stopPlayer} style={styles.ctrlBtn}>
            <Text style={styles.stopIcon}>✕</Text>
          </Pressable>
        </View>
      </View>

      {/* Barre de progression en bas du player */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    {
    position:        'absolute',
    left:            0,
    right:           0,
    zIndex:          999,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D40',
    // Ombre pour se détacher du contenu en dessous
    shadowColor:     '#000',
    shadowOpacity:   0.4,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       10,
  },
  inner:        {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 12,
    paddingVertical:   10,
    gap:            10,
  },
  cover:        { width: 42, height: 42, borderRadius: 8 },
  info:         { flex: 1 },
  trackName:    { color: '#fff', fontSize: 14, fontWeight: '600' },
  sub:          { color: '#6B7280', fontSize: 11, marginTop: 2 },
  controls:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ctrlBtn:      { padding: 8 },
  ctrlDisabled: { opacity: 0.3 },
  ctrlIcon:     { fontSize: 18, color: '#9CA3AF' },
  playBtn:      {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center', alignItems: 'center',
  },
  playIcon:     { fontSize: 16 },
  stopIcon:     { fontSize: 14, color: '#EF4444', fontWeight: 'bold' },
  progressBar:  { height: 2, backgroundColor: '#2D2D40' },
  progressFill: { height: 2, backgroundColor: '#7C3AED' },
});