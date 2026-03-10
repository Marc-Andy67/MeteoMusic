// store/playlists.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type WeatherMood = {
  id: string;
  label: string;
  emoji: string;
  color: string;
};

export const WEATHER_MOODS: WeatherMood[] = [
  { id: 'sunny',   label: 'Ensoleillé',  emoji: '☀️',  color: '#F59E0B' }, // code 0
  { id: 'cloudy',  label: 'Nuageux',     emoji: '⛅',   color: '#9CA3AF' }, // code 1-3
  { id: 'foggy',   label: 'Brumeux',     emoji: '🌫️',  color: '#6B7280' }, // code 4-48
  { id: 'drizzle', label: 'Bruine',      emoji: '🌦️',  color: '#60A5FA' }, // code 51-55
  { id: 'rainy',   label: 'Pluvieux',    emoji: '🌧️',  color: '#3B82F6' }, // code 56-67
  { id: 'snowy',   label: 'Neigeux',     emoji: '❄️',  color: '#BAE6FD' }, // code 71-77
  { id: 'shower',  label: 'Averses',     emoji: '🌧️',  color: '#2563EB' }, // code 80-82
  { id: 'sleet',   label: 'Neige fondue',emoji: '🌨️',  color: '#1E1B4B' }, // code 85-86
  { id: 'thunder', label: 'Orage',       emoji: '⛈️',  color: '#DC2626' }, // code 95+
];

export function weatherCodeToMoodId(code: number): string {
  if (code === 0)         return 'sunny';
  if (code <= 3)          return 'cloudy';
  if (code <= 48)         return 'foggy';
  if (code <= 55)         return 'drizzle';
  if (code <= 67)         return 'rainy';
  if (code <= 77)         return 'snowy';
  if (code <= 82)         return 'shower';
  if (code <= 86)         return 'sleet';
  return 'thunder';
}

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