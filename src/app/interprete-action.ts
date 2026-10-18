"use server";

import { interpretarTexto } from "@/lib/ia/interprete";
import { createClient } from "@/lib/supabase/server";

export async function interpretarTextoAction(texto: string) {
  if (!texto || texto.trim().length === 0) {
    throw new Error("Escribe algo primero.");
  }

  const supabase = await createClient();
  const { data: ambitos } = await supabase.from("scopes").select("name");
  const nombresAmbitos = (ambitos ?? []).map((a) => a.name);

  const hoyISO = new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Bogota",
  });

  return interpretarTexto(texto.trim(), hoyISO, nombresAmbitos);
}