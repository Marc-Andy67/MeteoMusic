// hooks/usePlaylistManager.ts
// Gestion du rechargement des playlists depuis AsyncStorage.
// Utilisé dans Music.tsx (modal d'ajout) et playlist-index.tsx.

import { useState, useCallback } from 'react';
import { Playlist, loadPlaylists } from '../storage/playlist';

export function usePlaylistManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const reload = useCallback(async () => {
    setPlaylists(await loadPlaylists());
  }, []);

  return { playlists, reload };
}