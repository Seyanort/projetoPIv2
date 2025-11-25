import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supaUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supaKey = Constants.expoConfig?.extra?.supabaseAnonKey;

export const supabase = createClient(supaUrl, supaKey);
