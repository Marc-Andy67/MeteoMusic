import 'expo-router/entry';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { navigate } from 'expo-router/build/global-state/routing';

// ─── Composants simples ───────────────────────────────────────────────────────


// ─── Counter — useState + useCallback + useRef ────────────────────────────────
export  function count() {
  const [count, setCount] = useState(0);
  const renderCount = useRef(0);
  renderCount.current += 1;
}

// ─── App ──────────────────────────────────────────────────────────────────────



export default function App() {
  const [count, setCount] = useState(0);

  // useCallback : mémorise onReset pour éviter de casser la mémo de Counter
  const handleReset = useCallback(() => setCount(0), []);

  const message = 'Hello, World!';


  return (
    <View style={styles.container}>
      <Text style={styles.title}>{message}</Text>
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