// app/Geolocalisation.tsx
// Page de géolocalisation et météo.
// Permet d'activer la position GPS pour avoir la météo locale,
// ou de rechercher manuellement une ville.

import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useWeather } from '../context/WeatherContext'; // Hook pour accéder au contexte météo global

export default function Geolocalisation() {

  // ── useWeather() ──────────────────────────────────────────────────────────
  // On récupère depuis le contexte global WeatherContext :
  // - temperature : température actuelle en °C
  // - weatherCode : code météo WMO (ex: 0 = soleil, 61 = pluie...)
  // - cityName    : nom de la ville détectée par le GPS
  // - currentMood : objet ambiance calculé depuis le weatherCode (emoji, couleur, label)
  // - active      : true si la géolocalisation est activée
  // - errorMsg    : message d'erreur si la permission GPS est refusée
  // - activate    : fonction pour démarrer la géolocalisation
  // - deactivate  : fonction pour arrêter la géolocalisation
  const {
    temperature, weatherCode, cityName, currentMood,
    active, errorMsg, activate, deactivate,
  } = useWeather();

  // ── États locaux pour la recherche manuelle ───────────────────────────────
  const [searchVisible, setSearchVisible] = useState(false);      // Affiche/cache la barre de recherche
  const [searchQuery,   setSearchQuery]   = useState('');          // Texte tapé dans la barre de recherche
  const [suggestions,   setSuggestions]   = useState<{            // Liste des villes proposées par l'API
    name: string; country: string; latitude: number; longitude: number
  }[]>([]);
  const [searchResult,  setSearchResult]  = useState<{            // Résultat météo de la ville cherchée
    city: string; temperature: number; emoji: string; color: string; label: string;
  } | null>(null);
  const [searchError,   setSearchError]   = useState<string | null>(null); // Erreur de recherche

  // ── getMoodFromCode() ─────────────────────────────────────────────────────
  // Convertit un code météo WMO en objet ambiance pour la recherche manuelle.
  // (Le contexte WeatherContext le fait pour la géolocalisation,
  //  mais ici on en a besoin localement pour la recherche par ville)
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

  // ── fetchSuggestions() ────────────────────────────────────────────────────
  // Appelée à chaque frappe dans la barre de recherche.
  // Utilise l'API Geocoding d'Open-Meteo pour trouver des villes correspondantes.
  // On attend au moins 2 caractères avant de lancer la recherche.
  const fetchSuggestions = async (text: string) => {
    setSearchQuery(text);
    setSearchError(null);
    if (text.length < 2) { setSuggestions([]); return; } // Pas assez de caractères

    // API Geocoding Open-Meteo : retourne jusqu'à 5 villes correspondant au nom
    const geoUrl  = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=5&language=fr&format=json`;
    const geoRes  = await fetch(geoUrl);
    const geoData = await geoRes.json();
    setSuggestions(geoData.results || []); // Si aucun résultat, tableau vide
  };

  // ── selectCity() ──────────────────────────────────────────────────────────
  // Appelée quand l'utilisateur appuie sur une suggestion.
  // Récupère la météo de la ville sélectionnée via l'API Open-Meteo.
  const selectCity = async (city: { name: string; country: string; latitude: number; longitude: number }) => {
    setSuggestions([]);          // Ferme la liste de suggestions
    setSearchQuery(city.name);   // Met le nom dans la barre de recherche
    setSearchError(null);

    try {
      // API météo Open-Meteo avec les coordonnées de la ville sélectionnée
      const meteoUrl  = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code&timezone=auto`;
      const meteoRes  = await fetch(meteoUrl);
      const meteoData = await meteoRes.json();
      const mood      = getMoodFromCode(meteoData.current.weather_code); // Convertit le code en ambiance

      // Sauvegarde le résultat pour l'afficher dans la carte
      setSearchResult({
        city:        `${city.name}, ${city.country}`,
        temperature: meteoData.current.temperature_2m,
        ...mood, // Spread de emoji, label, color
      });
    } catch {
      setSearchError('Erreur lors de la récupération de la météo');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Météo locale</Text>

      {/* Affiche l'erreur GPS si la permission est refusée */}
      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

      {/* ── Carte météo géolocalisation ──────────────────────────────────────
          Affichée uniquement si le GPS est actif ET qu'on a toutes les données.
          La bordure change de couleur selon l'ambiance météo (currentMood.color) */}
      {active && cityName && temperature !== null && currentMood && (
        <View style={[styles.card, { borderColor: currentMood.color, borderWidth: 2 }]}>
          <Text style={styles.city}>📍 {cityName}</Text>
          <Text style={styles.emoji}>{currentMood.emoji}</Text>
          <Text style={styles.temp}>{temperature}°C</Text>
          {/* Badge ambiance avec fond semi-transparent */}
          <View style={[styles.moodBadge, { backgroundColor: currentMood.color + '33' }]}>
            <Text style={[styles.moodLabel, { color: currentMood.color }]}>{currentMood.label}</Text>
          </View>
          <Text style={styles.hint}>🎵 La playlist "{currentMood.label}" se lance automatiquement</Text>
        </View>
      )}

      {/* ── Carte météo recherche manuelle ───────────────────────────────────
          Affichée uniquement après avoir sélectionné une ville dans la recherche */}
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

      {/* ── Barre de recherche avec suggestions ──────────────────────────────
          Visible uniquement si searchVisible est true.
          La liste de suggestions apparaît automatiquement sous le champ texte
          dès que des résultats sont disponibles. */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Nom de la ville..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={fetchSuggestions} // Lance la recherche à chaque frappe
            autoFocus                        // Ouvre le clavier automatiquement
          />
          {/* Liste des suggestions — affichée seulement si on a des résultats */}
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

      {/* Erreur de recherche manuelle */}
      {searchError && <Text style={styles.error}>{searchError}</Text>}

      {/* ── Bouton GPS ────────────────────────────────────────────────────────
          Affiche "Activer" ou "Désactiver" selon l'état active */}
      {!active ? (
        <Pressable style={styles.btn} onPress={activate}>
          <Text style={styles.btnText}>📍 Activer la géolocalisation</Text>
        </Pressable>
      ) : (
        <Pressable style={[styles.btn, styles.btnStop]} onPress={deactivate}>
          <Text style={styles.btnText}>⏹ Désactiver</Text>
        </Pressable>
      )}

      {/* ── Bouton recherche ──────────────────────────────────────────────────
          Ouvre/ferme la barre de recherche.
          Quand on ferme, on remet tout à zéro (résultat, query, suggestions) */}
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

// ── Styles ────────────────────────────────────────────────────────────────────
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