import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from "expo-router";

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

  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);

  const label = useMemo(() => {
    if (count > 0) return `Positif (${count})`;
    if (count < 0) return `Négatif (${count})`;
    return 'Zéro';
  }, [count]);

  useEffect(() => {
   // console.log(`[useEffect] Compteur : ${count}`);
    return () => /*console.log(`[useEffect cleanup]`);*/console.clear();
    
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
      <Text style={styles.sub}>Re-renders : {renderCount.current} (useRef)</Text>
      <Button title="＋1" onPress={increment} />
      <Button title="－1" onPress={decrement} />
      <Button title="Réinitialiser" onPress={onReset} />
      <Button title="Tester le Context" onPress={() => router.push('/TestContext')} />
    </View>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const router = useRouter(); // ← déclaré ICI dans le composant
  const [count, setCount] = useState(0);
  const handleReset = useCallback(() => setCount(0), []);
  const message = 'Hello, World!';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{message}</Text>
      <Greeting name="Alice" />
      <Button title="Aller sur Page 2" onPress={() => router.push('/Page2')} />
      <GreetingChild>Bob</GreetingChild>
      <Counter onReset={handleReset} router={router} />
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