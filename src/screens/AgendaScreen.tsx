import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { getEvents, addEvent, updateEvent, deleteEvent, EventRow } from "../services/events";
import dayjs from "dayjs";
import Toast from "react-native-root-toast";

export default function AgendaScreen() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [inputDate, setInputDate] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);

  const showToast = (msg: string) => {
    Toast.show(msg, {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
      delay: 0,
    });
  };

  const load = async () => {
    try {
      const evs = await getEvents();
      setEvents(evs);
    } catch (e) {
      console.log(e);
      showToast("Erro ao carregar eventos.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isValidTime = (time: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

  const formatTime = (input: string) => {
    const digits = input.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return digits.slice(0, 2) + ":" + digits.slice(2);
    return digits.slice(0, 2) + ":" + digits.slice(2, 4);
  };

  const formatDateInput = (input: string) => {
    const digits = input.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    return formatted;
  };

  const save = async () => {
    if (!selectedDate) return showToast("Selecione uma data.");
    if (!title.trim()) return showToast("Título obrigatório.");

    if (!allDay) {
      if (startTime && !isValidTime(startTime)) return showToast("Horário de início inválido.");
      if (endTime && !isValidTime(endTime)) return showToast("Horário de fim inválido.");
    }

    const payload = {
      title,
      description,
      date: selectedDate,
      start_time: allDay ? null : startTime || null,
      end_time: allDay ? null : endTime || null,
      all_day: allDay,
    };

    try {
      if (editing) {
        await updateEvent(editing.id, payload);
        showToast("Evento atualizado!");
        setEditing(null);
      } else {
        await addEvent(payload);
        showToast("Evento criado!");
      }

      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setAllDay(false);
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
    setStartTime(ev.start_time ?? "");
    setEndTime(ev.end_time ?? "");
    setAllDay(ev.all_day ?? false);
  };

  const remove = async (id: string) => {
    try {
      await deleteEvent(id);
      showToast("Evento excluído.");
      load();
    } catch (e) {
      showToast("Erro ao excluir.");
    }
  };

  const jumpToDate = () => {
    const match = inputDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return showToast("Digite a data no formato DD/MM/YYYY.");
    const [_, day, month, year] = match;
    const formatted = `${year}-${month}-${day}`;
    if (!dayjs(formatted, "YYYY-MM-DD", true).isValid()) return showToast("Data inválida.");
    setSelectedDate(formatted);
    setInputDate("");
  };

  const eventsOfDay = events.filter((e) => e.date === selectedDate);

  const markedDates = events.reduce((acc, e) => {
    acc[e.date] = { marked: true, dotColor: "#16a34a" };
    return acc;
  }, {} as { [key: string]: any });

  if (selectedDate) {
    markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: "#0a84ff" };
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        style={{ flex: 1, backgroundColor: "#fff" }}
        contentContainerStyle={{ padding: 14, paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Agenda</Text>

        {/* Input de data */}
        <View style={styles.rowInput}>
          <TextInput
            placeholder="Ir para data (DD/MM/YYYY)"
            value={inputDate}
            onChangeText={(text) => setInputDate(formatDateInput(text))}
            style={[styles.input, { flex: 1 }]}
            keyboardType="numeric"
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.goBtn} onPress={jumpToDate}>
            <Text style={{ color: "#fff" }}>Ir</Text>
          </TouchableOpacity>
        </View>

        {/* Calendário */}
        <Calendar
          key={selectedDate} // força mover para a data
          current={selectedDate}
          onDayPress={(d) => setSelectedDate(d.dateString)}
          markedDates={markedDates}
        />

        {/* Inputs do evento */}
        <TextInput placeholder="Título" value={title} onChangeText={setTitle} style={styles.input} />
        <TextInput placeholder="Descrição" value={description} onChangeText={setDescription} style={styles.input} />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Dia inteiro</Text>
          <Switch value={allDay} onValueChange={setAllDay} />
        </View>

        {!allDay && (
          <>
            <TextInput
              placeholder="Início (HH:MM)"
              value={startTime}
              onChangeText={(text) => setStartTime(formatTime(text))}
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Fim (HH:MM)"
              value={endTime}
              onChangeText={(text) => setEndTime(formatTime(text))}
              style={styles.input}
              keyboardType="numeric"
            />
          </>
        )}

        <TouchableOpacity style={styles.btn} onPress={save}>
          <Text style={styles.btnText}>{editing ? "Salvar" : "Adicionar"}</Text>
        </TouchableOpacity>

        <Text style={styles.subtitle}>{selectedDate ? `Eventos em ${selectedDate}` : "Selecione uma data"}</Text>

        {eventsOfDay.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>Nenhum evento</Text>
        ) : (
          <FlatList
            data={eventsOfDay}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text>{item.description}</Text>
                  {item.all_day ? (
                    <Text style={styles.timeText}>Dia inteiro</Text>
                  ) : (
                    <Text style={styles.timeText}>
                      {item.start_time} → {item.end_time}
                    </Text>
                  )}
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
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "600", marginBottom: 10 },
  subtitle: { marginTop: 12, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  goBtn: {
    backgroundColor: "#0a84ff",
    padding: 10,
    borderRadius: 6,
    marginLeft: 6,
  },
  rowInput: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  switchLabel: { flex: 1, fontSize: 16 },
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
  timeText: { marginTop: 3, fontStyle: "italic", color: "#444" },
});
