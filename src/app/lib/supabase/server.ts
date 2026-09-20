import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Conexión a Supabase para código que corre en el SERVIDOR.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Si esto se llama desde una página del servidor, se puede
            // ignorar: el archivo proxy.ts ya renueva la sesión.
          }
        },
      },
    }
  );
}