// app/Geolocalisation.tsx
// Page météo de l'application.
// Deux modes : géolocalisation GPS automatique ou recherche manuelle d'une ville.

import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
// weatherCodeToMoodId : convertit un code WMO en identifiant d'ambiance (ex: "sunny", "rainy")
// WEATHER_MOODS : tableau de toutes les ambiances disponibles avec emoji, couleur, label
import { weatherCodeToMoodId, WEATHER_MOODS } from '../storage/playlist';
// Styles globaux partagés entre toutes les pages
import { global } from '../styles/global';
// Variables de design : couleurs, espacements, rayons de bordure
import { colors, spacing, radius } from '../styles/theme';

// ── getMoodFromCode() ─────────────────────────────────────────────────────────
// Prend un code météo WMO (ex: 0, 61, 95) et retourne l'objet ambiance complet.
// Elle passe d'abord par weatherCodeToMoodId() pour obtenir l'id (ex: "sunny"),
// puis cherche cet id dans WEATHER_MOODS pour récupérer emoji, couleur et label.
// Retourne null si aucune ambiance trouvée.
function getMoodFromCode(code: number) {
  const moodId = weatherCodeToMoodId(code);
  return WEATHER_MOODS.find(m => m.id === moodId) ?? null;
}

export default function Geolocalisation() {

  // ── useWeather() ────────────────────────────────────────────────────────────
  // Données et fonctions partagées via le contexte global WeatherContext :
  // - temperature : température actuelle en °C (GPS)
  // - cityName    : nom de la ville détectée par le GPS
  // - currentMood : ambiance calculée depuis le code météo GPS
  // - active      : true si le GPS est activé
  // - errorMsg    : message si la permission GPS est refusée
  // - activate    : démarre la géolocalisation
  // - deactivate  : arrête la géolocalisation
  const { temperature, cityName, currentMood, active, errorMsg, activate, deactivate } = useWeather();

  // ── États locaux pour la recherche manuelle ─────────────────────────────────
  const [searchVisible, setSearchVisible] = useState(false);       // Affiche/cache la barre de recherche
  const [searchQuery,   setSearchQuery]   = useState('');           // Texte tapé par l'utilisateur
  const [suggestions,   setSuggestions]   = useState<{             // Villes proposées par l'API Geocoding
    name: string; country: string; latitude: number; longitude: number
  }[]>([]);
  const [searchResult, setSearchResult] = useState<{              // Résultat météo de la ville sélectionnée
    city: string; temperature: number; emoji: string; color: string; label: string;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null); // Erreur éventuelle

  // ── fetchSuggestions() ──────────────────────────────────────────────────────
  // Appelée à chaque frappe dans la barre de recherche.
  // On attend 2 caractères minimum pour éviter trop de requêtes inutiles.
  // Appelle l'API Geocoding d'Open-Meteo qui retourne jusqu'à 5 villes correspondantes.
  const fetchSuggestions = async (text: string) => {
    setSearchQuery(text);
    setSearchError(null);
    if (text.length < 2) { setSuggestions([]); return; }

    const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=5&language=fr&format=json`);
    const data = await res.json();
    setSuggestions(data.results || []); // Tableau vide si aucun résultat
  };

  // ── selectCity() ────────────────────────────────────────────────────────────
  // Appelée quand l'utilisateur appuie sur une suggestion.
  // 1. Ferme la liste de suggestions
  // 2. Appelle l'API météo Open-Meteo avec les coordonnées de la ville
  // 3. Convertit le code WMO en ambiance via getMoodFromCode()
  // 4. Sauvegarde le résultat dans searchResult pour l'afficher
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
        emoji:       mood?.emoji ?? '🌡️',           // Emoji par défaut si ambiance inconnue
        color:       mood?.color ?? colors.textSecondary,
        label:       mood?.label ?? 'Inconnu',
      });
    } catch {
      setSearchError('Erreur lors de la récupération de la météo');
    }
  };

  return (
    <View style={global.screenCentered}>
      <Text style={[global.headerTitle, { fontSize: 22 }]}>Météo locale</Text>

      {/* Erreur GPS si permission refusée */}
      {errorMsg && <Text style={global.error}>{errorMsg}</Text>}

      {/* ── Carte météo GPS ────────────────────────────────────────────────────
          Affichée uniquement si le GPS est actif ET toutes les données sont dispo.
          Bordure colorée selon l'ambiance météo (currentMood.color) */}
      {active && cityName && temperature !== null && currentMood && (
        <View style={[global.card, styles.cardFull, { borderColor: currentMood.color, borderWidth: 2 }]}>
          <Text style={styles.city}>📍 {cityName}</Text>
          <Text style={styles.emoji}>{currentMood.emoji}</Text>
          <Text style={styles.temp}>{temperature}°C</Text>
          {/* Badge ambiance : fond semi-transparent avec la couleur de l'ambiance */}
          <View style={[global.moodBadge, { backgroundColor: currentMood.color + '33' }]}>
            <Text style={[global.moodLabel, { color: currentMood.color }]}>{currentMood.label}</Text>
          </View>
          <Text style={global.hint}>🎵 La playlist "{currentMood.label}" se lance automatiquement</Text>
        </View>
      )}

      {/* ── Carte météo recherche manuelle ────────────────────────────────────
          Affichée après avoir sélectionné une ville dans la recherche */}
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

      {/* ── Barre de recherche avec suggestions ───────────────────────────────
          Visible seulement si searchVisible est true.
          Les suggestions apparaissent automatiquement sous le champ texte. */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Nom de la ville..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={fetchSuggestions} // Lance fetchSuggestions à chaque frappe
            autoFocus                        // Ouvre le clavier automatiquement
          />
          {/* Liste des suggestions — visible seulement si des résultats existent */}
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

      {/* Erreur de recherche manuelle */}
      {searchError && <Text style={global.error}>{searchError}</Text>}

      {/* ── Bouton GPS ─────────────────────────────────────────────────────────
          Affiche "Activer" ou "Désactiver" selon l'état active */}
      {!active ? (
        <Pressable style={global.btnFull} onPress={activate}>
          <Text style={global.btnText}>📍 Activer la géolocalisation</Text>
        </Pressable>
      ) : (
        <Pressable style={[global.btnFull, global.btnDark]} onPress={deactivate}>
          <Text style={global.btnText}>⏹ Désactiver</Text>
        </Pressable>
      )}

      {/* ── Bouton recherche ───────────────────────────────────────────────────
          Ouvre/ferme la barre de recherche.
          Quand on ferme, tout est remis à zéro pour repartir proprement */}
      <Pressable style={global.btnFull} onPress={() => {
        setSearchVisible(!searchVisible);
        setSearchResult(null);
        setSearchQuery('');
        setSuggestions([]);
      }}>
        <Text style={global.btnText}>{searchVisible ? '✕ Fermer la recherche' : '🔍 Rechercher une ville'}</Text>
      </Pressable>

      <StatusBar style="auto" />
    </View>
  );
}

// ── Styles locaux ─────────────────────────────────────────────────────────────
// Seuls les styles spécifiques à cette page sont ici.
// Les styles communs (card, btn, error...) viennent de global.ts et theme.ts
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