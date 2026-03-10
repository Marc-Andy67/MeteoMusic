import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useState, useRef } from 'react';
import * as Location from 'expo-location';

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activerGeolocalisation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission refusée');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);
    setActive(true);

    intervalRef.current = setInterval(async () => {
      const newLoc = await Location.getCurrentPositionAsync({});
      setLocation(newLoc);
    }, 5000);
  };

  const desactiverGeolocalisation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setLocation(null);
    setActive(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cherchez votre localisation</Text>
      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
      {location && (
        <Text style={styles.text}>
          Lat : {location.coords.latitude}{'\n'}
          Long : {location.coords.longitude}
        </Text>
      )}
      {!active && (
        <Button title="Activer la géolocalisation" onPress={activerGeolocalisation} />
      )}
      {active && (
        <Button title="Désactiver la géolocalisation" onPress={desactiverGeolocalisation} />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

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
  text: { fontSize: 16, color: '#333', textAlign: 'center' },
  error: { fontSize: 14, color: 'red' },
});