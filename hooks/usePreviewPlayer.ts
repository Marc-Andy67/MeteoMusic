// hooks/usePreviewPlayer.ts
// Lecture unitaire d'un track (preview) — logique partagée entre Music.tsx et playlists-detail.tsx
// Distinct du PlayerContext qui gère la lecture de playlists complètes.

import { useState, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Track } from '../storage/playlist';

export function usePreviewPlayer() {
  const [sound,     setSound]     = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      sound?.stopAsync().catch(() => {});
      sound?.unloadAsync().catch(() => {});
    };
  }, [sound]);

  const togglePlay = useCallback(async (track: Track) => {
    // Stoppe le son en cours dans tous les cas
    if (sound) {
      await sound.stopAsync().catch(() => {});
      await sound.unloadAsync().catch(() => {});
      setSound(null);

      // Si c'était déjà ce track → simple pause (toggle off)
      if (playingId === track.id) {
        setPlayingId(null);
        return;
      }
    }

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound: s } = await Audio.Sound.createAsync({ uri: track.audio });
    setSound(s);
    setPlayingId(track.id);
    await s.playAsync();
  }, [sound, playingId]);

  /** Stoppe la lecture en cours (utile avant de passer la main au PlayerContext) */
  const stopPreview = useCallback(async () => {
    if (sound) {
      await sound.stopAsync().catch(() => {});
      await sound.unloadAsync().catch(() => {});
      setSound(null);
      setPlayingId(null);
    }
  }, [sound]);

  return { playingId, togglePlay, stopPreview };
}