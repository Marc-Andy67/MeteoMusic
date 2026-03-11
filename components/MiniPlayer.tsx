// components/MiniPlayer.tsx
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '../context/PlayerContext';
import { colors, spacing, radius } from '../styles/theme';

export default function MiniPlayer() {
  const {
    currentTrack, isPlaying, playlistName,
    togglePause, nextTrack, prevTrack,
    currentIndex, queue, stopPlayer
  } = usePlayer();

  const insets = useSafeAreaInsets();

  if (!currentTrack) return null;

  const hasPrev  = currentIndex > 0;
  const hasNext  = currentIndex < queue.length - 1;
  const progress = ((currentIndex + 1) / queue.length) * 100;

  return (
    <View style={[styles.container, { top: insets.top }]}>
      <View style={styles.inner}>

        {/* Cover + infos */}
        <Image source={{ uri: currentTrack.album_image }} style={styles.cover} />
        <View style={{ flex: 1 }}>
          <Text style={styles.trackName} numberOfLines={1}>{currentTrack.name}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {playlistName}  ·  {currentIndex + 1}/{queue.length}
          </Text>
        </View>

        {/* Contrôles */}
        <View style={styles.controls}>
          <Pressable onPress={prevTrack} style={[styles.ctrlBtn, !hasPrev && styles.ctrlDisabled]} disabled={!hasPrev}>
            <Text style={styles.ctrlIcon}>⏮</Text>
          </Pressable>

          <Pressable onPress={togglePause} style={styles.playBtn}>
            <Text style={{ fontSize: 16 }}>{isPlaying ? '⏸' : '▶️'}</Text>
          </Pressable>

          <Pressable onPress={nextTrack} style={[styles.ctrlBtn, !hasNext && styles.ctrlDisabled]} disabled={!hasNext}>
            <Text style={styles.ctrlIcon}>⏭</Text>
          </Pressable>

          <Pressable onPress={stopPlayer} style={styles.ctrlBtn}>
            <Text style={{ fontSize: 14, color: colors.error, fontWeight: 'bold' }}>✕</Text>
          </Pressable>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    {
    position:          'absolute',
    left:              0,
    right:             0,
    zIndex:            999,
    backgroundColor:   colors.sheet,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor:       '#000',
    shadowOpacity:     0.4,
    shadowRadius:      8,
    shadowOffset:      { width: 0, height: 2 },
    elevation:         10,
  },
  inner:        {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.md,
    paddingVertical:   10,
    gap:               spacing.md,
  },
  cover:        { width: 42, height: 42, borderRadius: radius.sm },
  trackName:    { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  sub:          { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  controls:     { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ctrlBtn:      { padding: spacing.sm },
  ctrlDisabled: { opacity: 0.3 },
  ctrlIcon:     { fontSize: 18, color: colors.textSecondary },
  playBtn:      {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  progressBar:  { height: 2, backgroundColor: colors.border },
  progressFill: { height: 2, backgroundColor: colors.primary },
});