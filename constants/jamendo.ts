// constants/jamendo.ts
// Config Jamendo centralisée — utilisée dans Music.tsx et playlists-detail.tsx

export const JAMENDO_CLIENT_ID = 'c3e93b7e';
export const JAMENDO_BASE      = 'https://api.jamendo.com/v3.0';
export const JAMENDO_PAGE_SIZE = 200;

export const GENRES = ['Tous', 'rock', 'pop', 'jazz', 'electronic', 'classical', 'hiphop', 'metal', 'folk'];

export const SORT_OPTIONS = [
  { label: '🔥 Popularité', value: 'popularity_total' },
  { label: '🆕 Récent',     value: 'releasedate' },
  { label: '🔀 Aléatoire',  value: 'buzzrate' },
] as const;

/**
 * Récupère une page de tracks Jamendo.
 * Centralisé ici pour éviter la duplication entre Music.tsx et playlists-detail.tsx.
 */
export async function fetchJamendoPage(
  genre: string,
  order: string,
  offset: number,
  search = ''
) {
  const params = new URLSearchParams({
    client_id: JAMENDO_CLIENT_ID,
    format:    'json',
    limit:     String(JAMENDO_PAGE_SIZE),
    offset:    String(offset),
    imagesize: '200',
    order,
  });
  if (genre !== 'Tous') params.append('tags', genre);
  if (search.trim())    params.append('namesearch', search);

  const res  = await fetch(`${JAMENDO_BASE}/tracks?${params}`);
  const data = await res.json();
  return (data.results ?? []) as import('../storage/playlist').Track[];
}