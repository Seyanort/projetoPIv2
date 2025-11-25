import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
  ToastAndroid,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { getEvents, addEvent, updateEvent, deleteEvent, EventRow } from "../services/events";

export default function AgendaScreen() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<EventRow | null>(null);

  const showToast = (msg: string) => {
    Platform.OS === "android"
      ? ToastAndroid.show(msg, ToastAndroid.SHORT)
      : Alert.alert("Aviso", msg);
  };

  const load = async () => {
    try {
      const evs = await getEvents();
      setEvents(evs);
    } catch (e) {
      showToast("Erro ao carregar.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!selectedDate) return showToast("Selecione uma data.");
    if (!title.trim()) return showToast("Título obrigatório.");

    try {
      if (editing) {
        await updateEvent(editing.id, {
          title,
          description,
          date: selectedDate,
        });
        showToast("Atualizado.");
        setEditing(null);
      } else {
        await addEvent({
          title,
          description,
          date: selectedDate,
        });
        showToast("Criado.");
      }

      setTitle("");
      setDescription("");
      load();
    } catch (e) {
      console.log(e);
      showToast("Erro ao salvar evento.");
    }
  };

  const startEdit = (ev: EventRow) => {
    setEditing(ev);
    setTitle(ev.title);
    setDescription(ev.description ?? "");
    setSelectedDate(ev.date);
  };

  const remove = async (id: string) => {
    try {
      await deleteEvent(id);
      showToast("Excluído.");
      load();
    } catch (e) {
      showToast("Erro ao excluir.");
    }
  };

  const eventsOfDay = events.filter((e) => e.date === selectedDate);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agenda</Text>

      <Calendar
        onDayPress={(d) => setSelectedDate(d.dateString)}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: "#16a34a" },
        }}
      />

      <TextInput
        placeholder="Título"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TextInput
        placeholder="Descrição"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />

      <TouchableOpacity style={styles.btn} onPress={save}>
        <Text style={styles.btnText}>{editing ? "Salvar" : "Adicionar"}</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>
        {selectedDate ? `Eventos em ${selectedDate}` : "Selecione uma data"}
      </Text>

      <FlatList
        data={eventsOfDay}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text>{item.description}</Text>
            </View>

            <TouchableOpacity style={styles.smallBtn} onPress={() => startEdit(item)}>
              <Text style={{ color: "#fff" }}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: "red" }]}
              onPress={() => remove(item.id)}
            >
              <Text style={{ color: "#fff" }}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 10 },
  subtitle: { marginTop: 12, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  btn: {
    marginTop: 10,
    backgroundColor: "#0a84ff",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  eventTitle: { fontWeight: "700" },
  smallBtn: {
    padding: 6,
    backgroundColor: "orange",
    borderRadius: 6,
    marginLeft: 6,
  },
});