// store/playlists.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type WeatherMood = {
  id: string;
  label: string;
  emoji: string;
  color: string;
};

export const WEATHER_MOODS: WeatherMood[] = [
  { id: 'sunny',   label: 'Ensoleillé', emoji: '☀️',  color: '#F59E0B' },
  { id: 'rainy',   label: 'Pluvieux',   emoji: '🌧️',  color: '#3B82F6' },
  { id: 'storm',   label: 'Orageux',    emoji: '⛈️',  color: '#6B21A8' },
  { id: 'snowy',   label: 'Neigeux',    emoji: '❄️',  color: '#BAE6FD' },
  { id: 'foggy',   label: 'Brumeux',    emoji: '🌫️',  color: '#9CA3AF' },
  { id: 'night',   label: 'Nuit',       emoji: '🌙',  color: '#1E1B4B' },
];

export type Track = {
  id: string;
  name: string;
  artist_name: string;
  album_image: string;
  audio: string;
};

export type Playlist = {
  id: string;
  name: string;
  weatherId: string | null;
  tracks: Track[];
  createdAt: number;
};

const KEY = 'playlists_v1';

export async function loadPlaylists(): Promise<Playlist[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function savePlaylists(playlists: Playlist[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(playlists));
}

export async function createPlaylist(name: string, weatherId: string | null): Promise<Playlist> {
  const playlists = await loadPlaylists();
  const newOne: Playlist = {
    id: Date.now().toString(),
    name,
    weatherId,
    tracks: [],
    createdAt: Date.now(),
  };
  await savePlaylists([...playlists, newOne]);
  return newOne;
}

export async function deletePlaylist(id: string): Promise<void> {
  const playlists = await loadPlaylists();
  await savePlaylists(playlists.filter(p => p.id !== id));
}

export async function addTrackToPlaylist(playlistId: string, track: Track): Promise<void> {
  const playlists = await loadPlaylists();
  await savePlaylists(playlists.map(p =>
    p.id !== playlistId ? p :
    // évite les doublons
    p.tracks.find(t => t.id === track.id) ? p :
    { ...p, tracks: [...p.tracks, track] }
  ));
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const playlists = await loadPlaylists();
  await savePlaylists(playlists.map(p =>
    p.id !== playlistId ? p :
    { ...p, tracks: p.tracks.filter(t => t.id !== trackId) }
  ));
}