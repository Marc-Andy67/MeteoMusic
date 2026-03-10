// app/Geolocalisation.tsx
import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useWeather } from '../context/WeatherContext';

export default function Geolocalisation() {
  const {
    temperature, weatherCode, cityName, currentMood,
    active, errorMsg, activate, deactivate,
  } = useWeather();

  // ─── États pour la recherche manuelle ────────────────────────────────────
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [suggestions,   setSuggestions]   = useState<{ name: string; country: string; latitude: number; longitude: number }[]>([]);
  const [searchResult,  setSearchResult]  = useState<{
    city: string; temperature: number; emoji: string; color: string; label: string;
  } | null>(null);
  const [searchError,   setSearchError]   = useState<string | null>(null);

  // ─── Convertit le code WMO en mood simple ────────────────────────────────
  function getMoodFromCode(code: number) {
    if (code === 0)  return { emoji: '☀️', label: 'Ensoleillé',  color: '#F59E0B' };
    if (code <= 3)   return { emoji: '⛅', label: 'Nuageux',     color: '#9CA3AF' };
    if (code <= 48)  return { emoji: '🌫️', label: 'Brouillard',  color: '#6B7280' };
    if (code <= 55)  return { emoji: '🌦️', label: 'Bruine',      color: '#60A5FA' };
    if (code <= 67)  return { emoji: '🌧️', label: 'Pluvieux',    color: '#3B82F6' };
    if (code <= 77)  return { emoji: '❄️', label: 'Neigeux',     color: '#BAE6FD' };
    if (code <= 82)  return { emoji: '🌧️', label: 'Averses',     color: '#2563EB' };
    if (code <= 86)  return { emoji: '🌨️', label: 'Neige',       color: '#E0F2FE' };
    return           { emoji: '⛈️',        label: 'Orageux',     color: '#7C3AED' };
  }

  // ─── Cherche des suggestions au fur et à mesure de la frappe ─────────────
  const fetchSuggestions = async (text: string) => {
    setSearchQuery(text);
    setSearchError(null);
    if (text.length < 2) { setSuggestions([]); return; }

    const geoUrl  = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=5&language=fr&format=json`;
    const geoRes  = await fetch(geoUrl);
    const geoData = await geoRes.json();
    setSuggestions(geoData.results || []);
  };

  // ─── Sélectionne une suggestion et récupère la météo ─────────────────────
  const selectCity = async (city: { name: string; country: string; latitude: number; longitude: number }) => {
    setSuggestions([]);
    setSearchQuery(city.name);
    setSearchError(null);

    try {
      const meteoUrl  = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code&timezone=auto`;
      const meteoRes  = await fetch(meteoUrl);
      const meteoData = await meteoRes.json();
      const mood      = getMoodFromCode(meteoData.current.weather_code);

      setSearchResult({
        city:        `${city.name}, ${city.country}`,
        temperature: meteoData.current.temperature_2m,
        ...mood,
      });
    } catch {
      setSearchError('Erreur lors de la récupération de la météo');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Météo locale</Text>
      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

      {/* ── Carte météo géolocalisation ── */}
      {active && cityName && temperature !== null && currentMood && (
        <View style={[styles.card, { borderColor: currentMood.color, borderWidth: 2 }]}>
          <Text style={styles.city}>📍 {cityName}</Text>
          <Text style={styles.emoji}>{currentMood.emoji}</Text>
          <Text style={styles.temp}>{temperature}°C</Text>
          <View style={[styles.moodBadge, { backgroundColor: currentMood.color + '33' }]}>
            <Text style={[styles.moodLabel, { color: currentMood.color }]}>{currentMood.label}</Text>
          </View>
          <Text style={styles.hint}>🎵 La playlist "{currentMood.label}" se lance automatiquement</Text>
        </View>
      )}

      {/* ── Carte météo recherche manuelle ── */}
      {searchResult && (
        <View style={[styles.card, { borderColor: searchResult.color, borderWidth: 2 }]}>
          <Text style={styles.city}>🔍 {searchResult.city}</Text>
          <Text style={styles.emoji}>{searchResult.emoji}</Text>
          <Text style={styles.temp}>{searchResult.temperature}°C</Text>
          <View style={[styles.moodBadge, { backgroundColor: searchResult.color + '33' }]}>
            <Text style={[styles.moodLabel, { color: searchResult.color }]}>{searchResult.label}</Text>
          </View>
        </View>
      )}

      {/* ── Barre de recherche avec suggestions ── */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Nom de la ville..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={fetchSuggestions}
            autoFocus
          />
          {suggestions.length > 0 && (
            <View style={styles.suggestionsList}>
              {suggestions.map((s, i) => (
                <Pressable key={i} style={styles.suggestionItem} onPress={() => selectCity(s)}>
                  <Text style={styles.suggestionText}>📍 {s.name}, {s.country}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {searchError && <Text style={styles.error}>{searchError}</Text>}

      {/* ── Boutons ── */}
      {!active ? (
        <Pressable style={styles.btn} onPress={activate}>
          <Text style={styles.btnText}>📍 Activer la géolocalisation</Text>
        </Pressable>
      ) : (
        <Pressable style={[styles.btn, styles.btnStop]} onPress={deactivate}>
          <Text style={styles.btnText}>⏹ Désactiver</Text>
        </Pressable>
      )}

      <Pressable style={styles.btn} onPress={() => {
        setSearchVisible(!searchVisible);
        setSearchResult(null);
        setSearchQuery('');
        setSuggestions([]);
      }}>
        <Text style={styles.btnText}>
          {searchVisible ? '✕ Fermer la recherche' : '🔍 Rechercher une ville'}
        </Text>
      </Pressable>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0F0F1A', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  title:           { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  card:            { backgroundColor: '#1E1E2E', borderRadius: 16, padding: 24, alignItems: 'center', gap: 10, width: '100%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  city:            { fontSize: 18, fontWeight: '600', color: '#fff' },
  emoji:           { fontSize: 72 },
  temp:            { fontSize: 52, fontWeight: 'bold', color: '#fff' },
  moodBadge:       { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 4 },
  moodLabel:       { fontSize: 15, fontWeight: '600' },
  hint:            { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  btn:             { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, width: '100%', alignItems: 'center' },
  btnStop:         { backgroundColor: '#374151' },
  btnText:         { color: '#fff', fontSize: 16, fontWeight: '600' },
  error:           { fontSize: 14, color: '#EF4444' },
  searchContainer: { width: '100%', gap: 4 },
  searchInput:     { backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#2D2D40', width: '100%' },
  suggestionsList: { backgroundColor: '#1E1E2E', borderRadius: 12, borderWidth: 1, borderColor: '#2D2D40', overflow: 'hidden', marginTop: 4 },
  suggestionItem:  { padding: 14, borderBottomWidth: 1, borderBottomColor: '#2D2D40' },
  suggestionText:  { color: '#fff', fontSize: 15 },
});