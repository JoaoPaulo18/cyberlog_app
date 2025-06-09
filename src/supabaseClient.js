// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vwwgfrcbtotzedomatmz.supabase.co"; // Substitua pela URL do seu projeto Supabase
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3d2dmcmNidG90emVkb21hdG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzY2OTUsImV4cCI6MjA1ODYxMjY5NX0.kUojY8X555BoYfJOeHpYMUDz9ZsPzKZ4P9FyL6xJF7U"; // Substitua pela sua chave anonima

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
