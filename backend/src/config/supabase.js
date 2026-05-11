import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase env variables");
  console.error("SUPABASE_URL:", supabaseUrl ? "Loaded ✅" : "Missing ❌");
  console.error(
    "SUPABASE_SERVICE_KEY:",
    supabaseServiceKey ? "Loaded ✅" : "Missing ❌"
  );

  throw new Error("Supabase env variables missing ❌");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);