import { supabase } from "../lib/supabase";

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  user_id: string;
  created_at: string;
};

export async function getEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addEvent(evento: Partial<EventRow>) {
  const { error } = await supabase.from("events").insert(evento);
  if (error) throw error;
}

export async function updateEvent(id: string, evento: Partial<EventRow>) {
  const { error } = await supabase
    .from("events")
    .update(evento)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
