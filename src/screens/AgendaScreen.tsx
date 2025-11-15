import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ToastAndroid,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Calendar } from "react-native-calendars";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

const pad2 = (n: number) => String(n).padStart(2, "0");

const showToast = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert("Aviso", msg);
};

const diasNoMes = (ano: number, mes: number) => new Date(ano, mes, 0).getDate();

const validarDataReal = (d: number, m: number, y: number) => {
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return false;
  if (y < 1 || y > 9999) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1) return false;
  return d <= diasNoMes(y, m);
};

const parseDDMMYYYYtoISO = (input: string): string | null => {
  if (!input) return null;
  const s = input.trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return null;
  const [dd, mm, yyyy] = s.split("/").map(Number);
  if (!validarDataReal(dd, mm, yyyy)) return null;
  return `${String(yyyy).padStart(4, "0")}-${pad2(mm)}-${pad2(dd)}`;
};

const isoToDDMMYYYY = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${pad2(Number(d))}/${pad2(Number(m))}/${String(y).padStart(4, "0")}`;
};

const validarHorarioStrict = (h: string) => !!h && /^([01]\d|2[0-3]):([0-5]\d)$/.test(h);

const formatDateTyping = (raw: string) => {
  const nums = raw.replace(/\D/g, "").slice(0, 8);
  if (nums.length <= 2) return nums;
  if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`;
  return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4, 8)}`;
};

const finalizeDateInput = (text: string) => {
  const digits = text.replace(/\D/g, "");
  if (digits.length !== 8) return text;
  let d = Number(digits.slice(0, 2));
  let m = Number(digits.slice(2, 4));
  let y = Number(digits.slice(4, 8));
  if (m < 1) m = 1;
  if (m > 12) m = 12;
  if (y < 1) y = 1;
  if (y > 9999) y = 9999;
  const maxD = diasNoMes(y, m);
  if (d < 1) d = 1;
  if (d > maxD) d = maxD;
  return `${pad2(d)}/${pad2(m)}/${String(y).padStart(4, "0")}`;
};

const formatTimeTyping = (raw: string) => {
  const nums = raw.replace(/\D/g, "").slice(0, 4);
  if (nums.length <= 2) return nums;
  return `${nums.slice(0, 2)}:${nums.slice(2, 4)}`;
};

const finalizeTimeInput = (text: string) => {
  const digits = text.replace(/\D/g, "");
  if (digits.length < 3) return text;
  const hh = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4) || "0");
  let H = hh;
  let M = mm;
  if (H < 0) H = 0;
  if (H > 23) H = 23;
  if (M < 0) M = 0;
  if (M > 59) M = 59;
  return `${pad2(H)}:${pad2(M)}`;
};

type Evento = {
  id: string;
  titulo: string;
  dataISO: string;
  horario?: string;
  diaInteiro: boolean;
};

export default function AgendaScreen() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [titulo, setTitulo] = useState("");
  const [dataInput, setDataInput] = useState("");
  const [horario, setHorario] = useState("");
  const [diaInteiro, setDiaInteiro] = useState(false);
  const [selectedDateISO, setSelectedDateISO] = useState<string>("");
  const [editando, setEditando] = useState<Evento | null>(null);

  const STORAGE_KEY = "@agenda_eventos_v1";

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Evento[];
          parsed.sort(
            (a, b) =>
              dayjs(a.dataISO + " " + (a.horario ?? "00:00")).valueOf() -
              dayjs(b.dataISO + " " + (b.horario ?? "00:00")).valueOf()
          );
          setEventos(parsed);
        }
      } catch (e) {
        console.warn("Erro ao carregar eventos:", e);
        showToast("Erro ao carregar eventos.");
      }
    })();
  }, []);

  const salvarLocal = async (lista: Evento[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch (e) {
      console.warn("Erro ao salvar eventos:", e);
      showToast("Erro ao salvar eventos.");
    }
  };

  const markedDates = eventos.reduce<Record<string, any>>((acc, ev) => {
    acc[ev.dataISO] = { marked: true, dotColor: "#2b88ff" };
    return acc;
  }, {} as Record<string, any>);

  if (selectedDateISO) {
    markedDates[selectedDateISO] = {
      ...(markedDates[selectedDateISO] || {}),
      selected: true,
      selectedColor: "#16a34a",
    };
  }

  const onDayPress = (day: { dateString: string }) => {
    setSelectedDateISO(day.dateString);
    setDataInput(isoToDDMMYYYY(day.dateString));
  };

  const salvarEvento = async () => {
    const finalData = finalizeDateInput(dataInput);
    setDataInput(finalData);
    const iso = parseDDMMYYYYtoISO(finalData);
    if (!iso) {
      showToast("Data inválida. Use DD/MM/YYYY.");
      return;
    }
    if (!titulo.trim()) {
      showToast("Título obrigatório.");
      return;
    }
    const finalTime = horario ? finalizeTimeInput(horario) : "";
    setHorario(finalTime);
    if (!diaInteiro && finalTime && !validarHorarioStrict(finalTime)) {
      showToast("Horário inválido. Use HH:MM (00:00–23:59).");
      return;
    }

    if (editando) {
      const lista = eventos.map((ev) =>
        ev.id === editando.id
          ? {
              ...ev,
              titulo: titulo.trim(),
              dataISO: iso,
              horario: diaInteiro ? undefined : finalTime || undefined,
              diaInteiro,
            }
          : ev
      );
      lista.sort(
        (a, b) =>
          dayjs(a.dataISO + " " + (a.horario ?? "00:00")).valueOf() -
          dayjs(b.dataISO + " " + (b.horario ?? "00:00")).valueOf()
      );
      setEventos(lista);
      await salvarLocal(lista);
      showToast("Evento atualizado.");
      setEditando(null);
    } else {
      const novo: Evento = {
        id: uuidv4(),
        titulo: titulo.trim(),
        dataISO: iso,
        horario: diaInteiro ? undefined : finalTime || undefined,
        diaInteiro,
      };
      const lista = [...eventos, novo];
      lista.sort(
        (a, b) =>
          dayjs(a.dataISO + " " + (a.horario ?? "00:00")).valueOf() -
          dayjs(b.dataISO + " " + (b.horario ?? "00:00")).valueOf()
      );
      setEventos(lista);
      await salvarLocal(lista);
      showToast("Evento adicionado.");
    }

    setSelectedDateISO(iso);
    setTitulo("");
    setDataInput("");
    setHorario("");
    setDiaInteiro(false);
  };

  const iniciarEdicao = (ev: Evento) => {
    setEditando(ev);
    setTitulo(ev.titulo);
    setDataInput(isoToDDMMYYYY(ev.dataISO));
    setHorario(ev.horario ?? "");
    setDiaInteiro(ev.diaInteiro);
    setSelectedDateISO(ev.dataISO);
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setTitulo("");
    setDataInput("");
    setHorario("");
    setDiaInteiro(false);
  };

  const excluirEvento = async (id: string) => {
    const lista = eventos.filter((e) => e.id !== id);
    setEventos(lista);
    await salvarLocal(lista);
    showToast("Evento excluído.");
    if (!lista.some((ev) => ev.dataISO === selectedDateISO)) setSelectedDateISO("");
    if (editando && editando.id === id) setEditando(null);
  };

  const handleExcluir = (id: string) => {
    if (Platform.OS === "web") {
      const ok = (globalThis as any).confirm?.("Deseja excluir esse evento?");
      if (ok) excluirEvento(id);
      return;
    }
    Alert.alert("Excluir", "Deseja excluir esse evento?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => excluirEvento(id) },
    ]);
  };

  const eventosDoDia = eventos.filter((e) => e.dataISO === selectedDateISO);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <FlatList
          data={eventosDoDia}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <>
              <View style={styles.container}>
                <Text style={styles.header}>Agenda</Text>
                <Calendar
                  onDayPress={onDayPress}
                  markedDates={markedDates}
                  style={{ marginBottom: 10 }}
                  theme={{
                    arrowColor: "#16a34a",
                    todayTextColor: "#16a34a",
                    selectedDayBackgroundColor: "#16a34a",
                    selectedDayTextColor: "#fff",
                  }}
                />
                <View style={styles.form}>
                  <TextInput
                    placeholder="Título"
                    value={titulo}
                    onChangeText={setTitulo}
                    style={styles.input}
                    autoCorrect={false}
                  />
                  <TextInput
                    placeholder="Data (DD/MM/YYYY)"
                    value={dataInput}
                    onChangeText={(t) => {
                      const v = formatDateTyping(t);
                      setDataInput(v);
                      if (v.length === 10) setDataInput(finalizeDateInput(v));
                    }}
                    onBlur={() => setDataInput(finalizeDateInput(dataInput))}
                    style={styles.input}
                    keyboardType={"default"}
                    maxLength={10}
                  />
                  {!diaInteiro && (
                    <TextInput
                      placeholder="Horário (HH:MM)"
                      value={horario}
                      onChangeText={(t) => {
                        const v = formatTimeTyping(t);
                        setHorario(v);
                        if (v.length === 5) setHorario(finalizeTimeInput(v));
                      }}
                      onBlur={() => setHorario(finalizeTimeInput(horario))}
                      style={styles.input}
                      keyboardType={"default"}
                      maxLength={5}
                    />
                  )}
                  <View style={styles.row}>
                    <Text>Dia inteiro</Text>
                    <TouchableOpacity
                      onPress={() => setDiaInteiro((x) => !x)}
                      style={[styles.toggle, diaInteiro ? styles.toggleOn : styles.toggleOff]}
                    >
                      <Text style={{ color: diaInteiro ? "#fff" : "#000" }}>
                        {diaInteiro ? "Sim" : "Não"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, { marginLeft: 12 }]} onPress={salvarEvento}>
                      <Text style={styles.btnText}>{editando ? "Salvar" : "Adicionar"}</Text>
                    </TouchableOpacity>
                    {editando && (
                      <TouchableOpacity
                        style={[styles.btn, { backgroundColor: "#888", marginLeft: 8 }]}
                        onPress={cancelarEdicao}
                      >
                        <Text style={styles.btnText}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <Text style={{ fontWeight: "700", marginTop: 10 }}>
                  {selectedDateISO ? `Eventos em ${isoToDDMMYYYY(selectedDateISO)}` : "Selecione uma data"}
                </Text>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.eventRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{item.titulo}</Text>
                <Text style={{ color: "#555" }}>
                  {isoToDDMMYYYY(item.dataISO)} {item.diaInteiro ? "(Dia inteiro)" : `às ${item.horario}`}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: "orange" }]}
                onPress={() => iniciarEdicao(item)}
              >
                <Text style={{ color: "#fff" }}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: "red", marginLeft: 6 }]}
                onPress={() => handleExcluir(item.id)}
              >
                <Text style={{ color: "#fff" }}>Excluir</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={{ marginTop: 10 }}>Nenhum evento.</Text>}
        />
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  header: { fontSize: 20, fontWeight: "700", marginBottom: 5 },
  form: { marginTop: 5, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 6, borderRadius: 6, marginBottom: 6, fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center" },
  toggle: { padding: 4, borderRadius: 6, marginLeft: 8 },
  toggleOn: { backgroundColor: "#16a34a" },
  toggleOff: { backgroundColor: "#ddd" },
  btn: { backgroundColor: "#0a84ff", padding: 8, borderRadius: 6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  eventRow: { flexDirection: "row", padding: 8, borderBottomWidth: 1, borderBottomColor: "#eee", alignItems: "center" },
  eventTitle: { fontSize: 14, fontWeight: "600" },
  smallBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
});
