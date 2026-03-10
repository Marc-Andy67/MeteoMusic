import { View, Text, Button, StyleSheet } from 'react-native';
import { MyContextProvider, useMyContext } from './MyContext';

// ← Lit la valeur du contexte
function ComponentA() {
    const { value } = useMyContext();
    return <Text style={styles.text}>Valeur reçue : {value}</Text>;
}

// ← Modifie la valeur du contexte
function ComponentB() {
    const { setValue } = useMyContext();
    return (
        <View style={styles.buttons}>
            <Button title="Changer en 'Bonjour'" onPress={() => setValue('Bonjour')} />
            <Button title="Changer en 'Au revoir'" onPress={() => setValue('Au revoir')} />
        </View>
    );
}

export default function TestContext() {
    return (
        <MyContextProvider>
            <View style={styles.container}>
                <Text style={styles.title}>Test du Context</Text>
                {/* ComponentA et B partagent le même état via le contexte */}
                <ComponentA />
                <ComponentB />
                {/* Deuxième ComponentA pour prouver la synchro */}
                <ComponentA />
            </View>
        </MyContextProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
    title: { fontSize: 22, fontWeight: 'bold' },
    text: { fontSize: 18, color: '#333' },
    buttons: { gap: 8 },
});