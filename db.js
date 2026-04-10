import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_KEY = process.env.SUPABASE_KEY?.trim() ?? process.env.DATABASE_KEY?.trim();

if (!SUPABASE_URL) {
  throw new Error(
    "Falta la variable de entorno SUPABASE_URL. Añádela a tu archivo .env."
  );
}

if (!SUPABASE_KEY) {
  throw new Error(
    "Falta la variable de entorno SUPABASE_KEY o DATABASE_KEY. Añádela a tu archivo .env."
  );
}

try {
  new URL(SUPABASE_URL);
} catch (error) {
  throw new Error("SUPABASE_URL no es una URL válida.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Exportar el cliente
export { supabase };