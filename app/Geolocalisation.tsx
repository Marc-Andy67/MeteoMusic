// app/Geolocalisation.tsx
import { StyleSheet, Text, View, Pressable, TextInput, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import { weatherCodeToMoodId, WEATHER_MOODS } from '../storage/playlist';
import { global } from '../styles/global';
import { colors, spacing, radius } from '../styles/theme';

function getMoodFromCode(code: number) {
  const moodId = weatherCodeToMoodId(code);
  return WEATHER_MOODS.find(m => m.id === moodId) ?? null;
}

export default function Geolocalisation() {
  const { temperature, cityName, currentMood, active, errorMsg, activate, deactivate } = useWeather();

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [suggestions,   setSuggestions]   = useState<{ name: string; country: string; latitude: number; longitude: number }[]>([]);
  const [searchResult,  setSearchResult]  = useState<{
    city: string; temperature: number; emoji: string; color: string; label: string;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchSuggestions = async (text: string) => {
    setSearchQuery(text);
    setSearchError(null);
    if (text.length < 2) { setSuggestions([]); return; }
    const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=5&language=fr&format=json`);
    const data = await res.json();
    setSuggestions(data.results || []);
  };

  const selectCity = async (city: { name: string; country: string; latitude: number; longitude: number }) => {
    setSuggestions([]);
    setSearchQuery(city.name);
    setSearchError(null);
    try {
      const res  = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code&timezone=auto`);
      const data = await res.json();
      const mood = getMoodFromCode(data.current.weather_code);
      setSearchResult({
        city:        `${city.name}, ${city.country}`,
        temperature: data.current.temperature_2m,
        emoji:       mood?.emoji ?? '🌡️',
        color:       mood?.color ?? colors.textSecondary,
        label:       mood?.label ?? 'Inconnu',
      });
    } catch {
      setSearchError('Erreur lors de la récupération de la météo');
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        alignItems: 'center',
        gap: spacing.lg,
        padding: spacing.xl,
        paddingBottom: 40,
      }}
    >
      <Text style={[global.headerTitle, { fontSize: 22 }]}>Météo locale</Text>
      {errorMsg && <Text style={global.error}>{errorMsg}</Text>}

      {active && cityName && temperature !== null && currentMood && (
        <View style={[global.card, styles.cardFull, { borderColor: currentMood.color, borderWidth: 2 }]}>
          <Text style={styles.city}>📍 {cityName}</Text>
          <Text style={styles.emoji}>{currentMood.emoji}</Text>
          <Text style={styles.temp}>{temperature}°C</Text>
          <View style={[global.moodBadge, { backgroundColor: currentMood.color + '33' }]}>
            <Text style={[global.moodLabel, { color: currentMood.color }]}>{currentMood.label}</Text>
          </View>
          <Text style={global.hint}>🎵 La playlist "{currentMood.label}" se lance automatiquement</Text>
        </View>
      )}

      {searchResult && (
        <View style={[global.card, styles.cardFull, { borderColor: searchResult.color, borderWidth: 2 }]}>
          <Text style={styles.city}>🔍 {searchResult.city}</Text>
          <Text style={styles.emoji}>{searchResult.emoji}</Text>
          <Text style={styles.temp}>{searchResult.temperature}°C</Text>
          <View style={[global.moodBadge, { backgroundColor: searchResult.color + '33' }]}>
            <Text style={[global.moodLabel, { color: searchResult.color }]}>{searchResult.label}</Text>
          </View>
        </View>
      )}

      {searchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Nom de la ville..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={fetchSuggestions}
            autoFocus
          />
          {suggestions.length > 0 && (
            <View style={styles.suggestionsList}>
              {suggestions.map((s, i) => (
                <Pressable key={i} style={styles.suggestionItem} onPress={() => selectCity(s)}>
                  <Text style={global.textPrimary}>📍 {s.name}, {s.country}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {searchError && <Text style={global.error}>{searchError}</Text>}

      {!active ? (
        <Pressable style={global.btnFull} onPress={activate}>
          <Text style={global.btnText}>📍 Activer la géolocalisation</Text>
        </Pressable>
      ) : (
        <Pressable style={[global.btnFull, global.btnDark]} onPress={deactivate}>
          <Text style={global.btnText}>⏹ Désactiver</Text>
        </Pressable>
      )}

      <Pressable style={global.btnFull} onPress={() => {
        setSearchVisible(!searchVisible);
        setSearchResult(null);
        setSearchQuery('');
        setSuggestions([]);
      }}>
        <Text style={global.btnText}>{searchVisible ? '✕ Fermer la recherche' : '🔍 Rechercher une ville'}</Text>
      </Pressable>

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardFull:        { width: '100%', alignItems: 'center', gap: 10 },
  city:            { fontSize: 18, fontWeight: '600', color: '#fff' },
  emoji:           { fontSize: 72 },
  temp:            { fontSize: 52, fontWeight: 'bold', color: '#fff' },
  searchContainer: { width: '100%', gap: spacing.xs },
  searchInput:     { backgroundColor: colors.card, color: '#fff', borderRadius: radius.md, padding: 14, fontSize: 16, borderWidth: 1, borderColor: colors.border, width: '100%' },
  suggestionsList: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginTop: spacing.xs },
  suggestionItem:  { padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
});