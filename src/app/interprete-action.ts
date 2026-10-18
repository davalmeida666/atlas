"use server";

import { interpretarTexto } from "@/lib/ia/interprete";

export async function interpretarTextoAction(texto: string) {
  if (!texto || texto.trim().length === 0) {
    throw new Error("Escribe algo primero.");
  }

  const hoyISO = new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Bogota",
  });

  return interpretarTexto(texto.trim(), hoyISO);
}