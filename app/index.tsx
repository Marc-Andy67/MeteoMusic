import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, FlatList } from 'react-native';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Composants simples ───────────────────────────────────────────────────────

function Greeting({ name }: { name: string }) {
  return <Text style={styles.text}>Hello, {name}!</Text>;
}

function GreetingChild({ children }: { children: string }) {
  return <Text style={styles.text}>Bonjour, enfant {children}</Text>;
}

// ─── Counter ─────────────────────────────────────────────────────────────────

function Counter({ onReset, router }: { onReset: () => void; router: ReturnType<typeof useRouter> }) {
  const [count, setCount] = useState(0);
  const renderCount = useRef(0);
  renderCount.current += 1;

  // ── AsyncStorage : charger le compteur au démarrage ──────────────────────
  useEffect(() => {
    const loadCount = async () => {
      try {
        const saved = await AsyncStorage.getItem('counter');
        if (saved !== null) {
          setCount(parseInt(saved));
          console.log('[AsyncStorage] Compteur chargé :', saved);
        }
      } catch (e) {
        console.error('[AsyncStorage] Erreur lecture :', e);
      }
    };
    loadCount();
  }, []); // ← une seule fois au montage

  // ── AsyncStorage : sauvegarder à chaque changement de count ──────────────
  useEffect(() => {
    const saveCount = async () => {
      try {
        await AsyncStorage.setItem('counter', String(count));
        console.log('[AsyncStorage] Compteur sauvegardé :', count);
      } catch (e) {
        console.error('[AsyncStorage] Erreur écriture :', e);
      }
    };
    saveCount();
  }, [count]); // ← se relance à chaque changement de count

  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);

  // ── Reset : remet à 0 ET efface AsyncStorage ─────────────────────────────
  const handleResetWithStorage = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('counter');
      console.log('[AsyncStorage] Compteur effacé');
      onReset();
    } catch (e) {
      console.error('[AsyncStorage] Erreur suppression :', e);
    }
  }, [onReset]);

  const label = useMemo(() => {
    if (count > 0) return `Positif (${count})`;
    if (count < 0) return `Négatif (${count})`;
    return 'Zéro';
  }, [count]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => (c < 100 ? c + 1 : c));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      {count >= 100 ? <Text style={{ color: 'red', fontWeight: 'bold' }}>🚨 Limite atteinte !</Text> : null}
      <Text style={styles.sub}>Re-renders : {renderCount.current} (useRef)</Text>
      <Button title="＋1" onPress={increment} />
      <Button title="－1" onPress={decrement} />
      <Button title="Réinitialiser" onPress={handleResetWithStorage} />
      <Button title="Tester le Context" onPress={() => router.push('/TestContext')} />
    </View>
  );
}

// ─── Données ──────────────────────────────────────────────────────────────────

const items = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Charlie' },
  { id: '4', name: 'David' },
  { id: '5', name: 'Eve' },
  { id: '6', name: 'Frank' },
  { id: '7', name: 'Grace' },
  { id: '8', name: 'Hugo' },
  { id: '9', name: 'Iris' },
  { id: '10', name: 'Jules' },
  { id: '11', name: 'Karen' },
  { id: '12', name: 'Louis' },
  { id: '13', name: 'Marie' },
  { id: '14', name: 'Noel' },
  { id: '15', name: 'Olivia' },
  { id: '16', name: 'Paul' },
  { id: '17', name: 'Quinn' },
  { id: '18', name: 'Rose' },
  { id: '19', name: 'Sam' },
  { id: '20', name: 'Tina' },
];

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const router = useRouter();
  const message = 'MeteoMusic';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{message}</Text>
      <Button title="Cherchez votre localisation" onPress={() => router.push('/Geolocalisation')} />
      <Button title="Voir mes playlists" onPress={() => router.push('/playlist-index')} />
      <StatusBar style="auto" />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  text: { fontSize: 16, color: '#333' },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  sub: { fontSize: 12, color: '#888', textAlign: 'center' },
});