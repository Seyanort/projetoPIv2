// AgendaScreen.tsx
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Calendar } from "react-native-calendars";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

/* ============================
   Utilitários e validação
   ============================ */

const pad2 = (n: number) => String(n).padStart(2, "0");

// Toast wrapper: tenta usar react-native-root-toast se disponível, senão fallback
const showToast = (msg: string) => {
  try {
    // tenta usar react-native-root-toast se instalado
    // @ts-ignore
    const RootToast = require("react-native-root-toast");
    if (RootToast && typeof RootToast.show === "function") {
      // @ts-ignore
      RootToast.show(msg, { duration: RootToast.durations.SHORT });
      return;
    }
  } catch (e) {
    // não instalado -> fallback abaixo
  }

  if (Platform.OS === "android") {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert("Aviso", msg);
  }
};

const validarDataReal = (dia: number, mes: number, ano: number) => {
  if (!Number.isInteger(dia) || !Number.isInteger(mes) || !Number.isInteger(ano)) return false;
  if (ano < 1 || ano > 9999) return false;
  if (mes < 1 || mes > 12) return false;
  if (dia < 1) return false;

  // dias no mês (inclui bissexto)
  const diasNoMes = new Date(ano, mes, 0).getDate();
  return dia <= diasNoMes;
};

/**
 * Aceita:
 *  - DD/MM/YYYY (ex: 05/07/2025)
 *  - D/M/YYYY (ex: 5/7/2025)
 *  - YYYY-MM-DD (ex: 2025-07-05)
 *  - YYYY/MM/DD (ex: 2025/07/05)
 * Retorna iso YYYY-MM-DD ou null
 */
const parseDateToISO = (input: string): string | null => {
  if (!input) return null;
  const s = input.trim();
  const norm = s.replace(/\s+/g, "");
  // aceita / ou -
  if (norm.includes("/")) {
    const parts = norm.split("/");
    if (parts.length !== 3) return null;
    if (parts[0].length === 4) {
      // YYYY/MM/DD
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      if (!validarDataReal(d, m, y)) return null;
      return `${String(y).padStart(4, "0")}-${pad2(m)}-${pad2(d)}`;
    } else {
      // DD/MM/YYYY
      const d = Number(parts[0]);
      const m = Number(parts[1]);
      const y = Number(parts[2]);
      if (!validarDataReal(d, m, y)) return null;
      return `${String(y).padStart(4, "0")}-${pad2(m)}-${pad2(d)}`;
    }
  } else if (norm.includes("-")) {
    const parts = norm.split("-");
    if (parts.length !== 3) return null;
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      if (!validarDataReal(d, m, y)) return null;
      return `${String(y).padStart(4, "0")}-${pad2(m)}-${pad2(d)}`;
    } else {
      // DD-MM-YYYY
      const d = Number(parts[0]);
      const m = Number(parts[1]);
      const y = Number(parts[2]);
      if (!validarDataReal(d, m, y)) return null;
      return `${String(y).padStart(4, "0")}-${pad2(m)}-${pad2(d)}`;
    }
  }

  return null;
};

const isoToDDMMYYYY = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${pad2(Number(d))}/${pad2(Number(m))}/${String(y).padStart(4, "0")}`;
};

const validarHorario = (h: string) => {
  if (!h) return false;
  const re = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return re.test(h);
};

/* ============================
   Tipos
   ============================ */

type Evento = {
  id: string;
  titulo: string;
  dataISO: string; // YYYY-MM-DD
  horario?: string; // HH:mm
  diaInteiro: boolean;
};

/* ============================
   Componente principal
   ============================ */

export default function AgendaScreen() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [titulo, setTitulo] = useState("");
  const [dataInput, setDataInput] = useState("");
  const [horario, setHorario] = useState("");
  const [diaInteiro, setDiaInteiro] = useState(false);

  const [selectedDateISO, setSelectedDateISO] = useState<string>(""); // YYYY-MM-DD
  const [editando, setEditando] = useState<Evento | null>(null);

  const STORAGE_KEY = "@agenda_eventos_v1";

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Evento[];
          parsed.sort((a, b) =>
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

  // markedDates com tipagem explícita para evitar erro TS
  const markedDates = eventos.reduce<Record<string, any>>((acc, ev) => {
    acc[ev.dataISO] = { marked: true, dotColor: "#2b88ff" };
    return acc;
  }, {});

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
    const iso = parseDateToISO(dataInput);
    if (!iso) {
      showToast("Data inválida. Use DD/MM/YYYY ou YYYY-MM-DD.");
      return;
    }

    if (!titulo.trim()) {
      showToast("Título obrigatório.");
      return;
    }

    if (!diaInteiro && !validarHorario(horario)) {
      showToast("Horário inválido. Use HH:MM (00:00–23:59).");
      return;
    }

    if (editando) {
      const lista = eventos.map((ev) =>
        ev.id === editando.id
          ? { ...ev, titulo: titulo.trim(), dataISO: iso, horario: diaInteiro ? undefined : horario, diaInteiro }
          : ev
      );

      lista.sort((a, b) =>
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
        horario: diaInteiro ? undefined : horario,
        diaInteiro,
      };

      const lista = [...eventos, novo];

      lista.sort((a, b) =>
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
    if (!lista.some((ev) => ev.dataISO === selectedDateISO)) {
      setSelectedDateISO("");
    }
    if (editando && editando.id === id) setEditando(null);
  };

  const eventosDoDia = eventos.filter((e) => e.dataISO === selectedDateISO);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Agenda</Text>

      <Calendar onDayPress={onDayPress} markedDates={markedDates} />

      <View style={styles.form}>
        <TextInput
          placeholder="Título"
          value={titulo}
          onChangeText={setTitulo}
          style={styles.input}
        />

        <TextInput
          placeholder="Data (DD/MM/YYYY ou YYYY-MM-DD)"
          value={dataInput}
          onChangeText={setDataInput}
          style={styles.input}
          editable
          keyboardType={Platform.OS === "web" ? "default" : "numeric"}
        />

        {!diaInteiro && (
          <TextInput
            placeholder="Horário (HH:MM — 24h)"
            value={horario}
            onChangeText={setHorario}
            style={styles.input}
            editable
            keyboardType={Platform.OS === "web" ? "default" : "numeric"}
          />
        )}

        <View style={styles.row}>
          <Text>Dia inteiro</Text>

          <TouchableOpacity
            onPress={() => setDiaInteiro((x) => !x)}
            style={[styles.toggle, diaInteiro ? styles.toggleOn : styles.toggleOff]}
          >
            <Text style={{ color: diaInteiro ? "#fff" : "#000" }}>{diaInteiro ? "Sim" : "Não"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, { marginLeft: 12 }]} onPress={salvarEvento}>
            <Text style={styles.btnText}>{editando ? "Salvar" : "Adicionar"}</Text>
          </TouchableOpacity>

          {editando && (
            <TouchableOpacity style={[styles.btn, { backgroundColor: "#888", marginLeft: 8 }]} onPress={cancelarEdicao}>
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={{ fontWeight: "700", marginTop: 10 }}>
        {selectedDateISO ? `Eventos em ${isoToDDMMYYYY(selectedDateISO)}` : "Selecione uma data"}
      </Text>

      <FlatList
        data={eventosDoDia}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>Nenhum evento.</Text>}
        renderItem={({ item }) => (
          <View style={styles.eventRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventTitle}>{item.titulo}</Text>
              <Text style={{ color: "#555" }}>{isoToDDMMYYYY(item.dataISO)} {item.diaInteiro ? "(Dia inteiro)" : `às ${item.horario}`}</Text>
            </View>

            <TouchableOpacity style={[styles.smallBtn, { backgroundColor: "orange" }]} onPress={() => iniciarEdicao(item)}>
              <Text style={{ color: "#fff" }}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.smallBtn, { backgroundColor: "red", marginLeft: 6 }]} onPress={() => {
              Alert.alert("Excluir", "Deseja excluir?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: () => excluirEvento(item.id) }
              ]);
            }}>
              <Text style={{ color: "#fff" }}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

/* ============================
   Estilos
   ============================ */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  form: { marginTop: 10, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 6, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center" },
  toggle: { padding: 6, borderRadius: 6, marginLeft: 8 },
  toggleOn: { backgroundColor: "#16a34a" },
  toggleOff: { backgroundColor: "#ddd" },
  btn: { backgroundColor: "#0a84ff", padding: 10, borderRadius: 6 },
  btnText: { color: "#fff", fontWeight: "700" },
  eventRow: { flexDirection: "row", padding: 10, borderBottomWidth: 1, borderBottomColor: "#eee", alignItems: "center" },
  eventTitle: { fontSize: 16, fontWeight: "600" },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
});
