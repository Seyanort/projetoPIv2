import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, Switch, StyleSheet } from "react-native";

export default function AgendaScreen() {
  const [eventos, setEventos] = useState<
    { id: string; titulo: string; data: string; horario?: string; diaInteiro: boolean }[]
  >([]);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [diaInteiro, setDiaInteiro] = useState(false);

  const adicionarEvento = () => {
    if (titulo.trim() === "" || data.trim() === "") return;

    const novoEvento = {
      id: Date.now().toString(),
      titulo,
      data,
      horario: diaInteiro ? undefined : horario,
      diaInteiro,
    };

    setEventos([...eventos, novoEvento]);
    setTitulo("");
    setData("");
    setHorario("");
    setDiaInteiro(false);
  };

  const removerEvento = (id: string) => {
    setEventos(eventos.filter((e) => e.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minha Agenda</Text>

      <TextInput
        placeholder="Título do evento"
        value={titulo}
        onChangeText={setTitulo}
        style={styles.input}
      />

      <TextInput
        placeholder="Data (ex: 10/11/2025)"
        value={data}
        onChangeText={setData}
        style={styles.input}
      />

      <View style={styles.switchContainer}>
        <Text>Dia inteiro?</Text>
        <Switch value={diaInteiro} onValueChange={setDiaInteiro} />
      </View>

      {!diaInteiro && (
        <TextInput
          placeholder="Horário (ex: 14:30)"
          value={horario}
          onChangeText={setHorario}
          style={styles.input}
        />
      )}

      <Button title="Adicionar" onPress={adicionarEvento} />

      <FlatList
        data={eventos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.eventTitle}>{item.titulo}</Text>
              <Text style={styles.eventDetails}>
                {item.data}{" "}
                {item.diaInteiro ? "(Dia inteiro)" : `às ${item.horario}`}
              </Text>
            </View>
            <Button title="Excluir" onPress={() => removerEvento(item.id)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginVertical: 5,
    borderRadius: 5,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventTitle: { fontSize: 16, fontWeight: "500" },
  eventDetails: { color: "#555" },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
});
