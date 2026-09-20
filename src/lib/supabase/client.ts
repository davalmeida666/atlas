import { createBrowserClient } from "@supabase/ssr";

// Conexión a Supabase para código que corre en el NAVEGADOR.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
