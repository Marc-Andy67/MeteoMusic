// context/PlayerContext.tsx
import { createContext, use, useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';

// ─── Types ────────────────────────────────────────────────────────────────────
export type PlayerTrack = {
  id: string;
  name: string;
  artist_name: string;
  album_image: string;
  audio: string;
};

type PlayerContextType = {
  currentTrack:  PlayerTrack | null;
  currentIndex:  number;
  queue:         PlayerTrack[];
  isPlaying:     boolean;
  playlistName:  string;
  playPlaylist:  (tracks: PlayerTrack[], name: string, startIndex?: number) => Promise<void>;
  togglePause:   () => Promise<void>;
  nextTrack:     () => Promise<void>;
  prevTrack:     () => Promise<void>;
  stopPlayer:    () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = use(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue,        setQueue]        = useState<PlayerTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [playlistName, setPlaylistName] = useState('');

  const soundRef    = useRef<Audio.Sound | null>(null);
  // Refs pour éviter les closures périmées dans setOnPlaybackStatusUpdate
  const queueRef    = useRef<PlayerTrack[]>([]);
  const indexRef    = useRef(0);
  const stoppedRef  = useRef(false); // évite l'autoplay après stopPlayer

  const currentTrack = queue[currentIndex] ?? null;

  // ── Nettoyage ─────────────────────────────────────────────────────────────
  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
  }, []);

  // ── Jouer un index — utilise les refs, pas le state ───────────────────────
  const playIndex = useCallback(async (index: number) => {
    stoppedRef.current = false;
    await unloadSound();

    const track = queueRef.current[index];
    if (!track) return;

    // Met à jour l'index dans le state ET la ref
    indexRef.current = index;
    setCurrentIndex(index);

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync(
      { uri: track.audio },
      { shouldPlay: true }
    );
    soundRef.current = sound;
    setIsPlaying(true);

    // Callback de fin de track — utilise les refs → toujours à jour
    sound.setOnPlaybackStatusUpdate(status => {
      if (!status.isLoaded || !status.didJustFinish) return;
      if (stoppedRef.current) return; // stopPlayer a été appelé

      const next = indexRef.current + 1;
      if (next < queueRef.current.length) {
        playIndex(next);
      } else {
        setIsPlaying(false);
      }
    });
  }, [unloadSound]);

  // ── API publique ───────────────────────────────────────────────────────────
  const playPlaylist = useCallback(async (
    tracks: PlayerTrack[],
    name: string,
    startIndex = 0
  ) => {
    // Met à jour la ref EN PREMIER avant playIndex
    queueRef.current = tracks;
    setQueue(tracks);
    setPlaylistName(name);
    await playIndex(startIndex);
  }, [playIndex]);

  const togglePause = useCallback(async () => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, []);

  const nextTrack = useCallback(async () => {
    const next = indexRef.current + 1;
    if (next >= queueRef.current.length) return;
    await playIndex(next);
  }, [playIndex]);

  const prevTrack = useCallback(async () => {
    const prev = indexRef.current - 1;
    if (prev < 0) return;
    await playIndex(prev);
  }, [playIndex]);

  const stopPlayer = useCallback(async () => {
    stoppedRef.current = true; // bloque l'autoplay
    await unloadSound();
    setIsPlaying(false);
    setQueue([]);
    setCurrentIndex(0);
    setPlaylistName('');
    queueRef.current = [];
    indexRef.current = 0;
  }, [unloadSound]);

  useEffect(() => () => { unloadSound(); }, [unloadSound]);

  return (
    <PlayerContext value={{
      currentTrack, currentIndex, queue, isPlaying, playlistName,
      playPlaylist, togglePause, nextTrack, prevTrack, stopPlayer,
    }}>
      {children}
    </PlayerContext>
  );
}