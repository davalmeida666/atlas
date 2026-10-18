"use server";

import { interpretarTexto } from "@/lib/ia/interprete";

export async function interpretarTextoAction(texto: string) {
  if (!texto || texto.trim().length === 0) {
    throw new Error("Escribe algo primero.");
  }

  // La fecha de hoy la calcula el SERVIDOR, en hora de Colombia.
  const hoyISO = new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Bogota",
  });

  return interpretarTexto(texto.trim(), hoyISO);
}
