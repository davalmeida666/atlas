import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export type TareaInterpretada = {
  titulo: string;
  tipo: "tarea" | "proyecto";
  fecha: string | null; // formato AAAA-MM-DD, o null si no detectó fecha
};

// Le pide a Gemini que devuelva SIEMPRE este formato exacto.
const INSTRUCCIONES = `Eres el interprete de ATLAS, un asistente de tareas.
Recibes una frase en español de un estudiante y devuelves SOLO un JSON,
sin texto adicional, sin backticks de markdown, con esta forma exacta:

{"titulo": string, "tipo": "tarea" o "proyecto", "fecha": "AAAA-MM-DD" o null}

Reglas:
- "titulo": un resumen corto y claro de lo que hay que hacer.
- "tipo": "proyecto" solo si implica varias etapas grandes (un corto, una app,
  una investigacion larga). Si no estas seguro, usa "tarea".
- "fecha": si el texto menciona un dia (hoy, manana, el martes, el 15 de mayo),
  calcula la fecha real usando la FECHA DE HOY que te doy abajo. Si no hay
  ninguna fecha mencionada, usa null. Nunca inventes una fecha que no este
  implicada por el texto.`;

export async function interpretarTexto(
  texto: string,
  hoyISO: string // formato AAAA-MM-DD, ej. "2026-10-18"
): Promise<TareaInterpretada> {
  const respuesta = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `FECHA DE HOY: ${hoyISO}\n\nFRASE DEL USUARIO: "${texto}"`,
    config: {
      systemInstruction: INSTRUCCIONES,
      responseMimeType: "application/json",
    },
  });

  const crudo = respuesta.text;
  if (!crudo) {
    throw new Error("Gemini no devolvio texto.");
  }

  let datos: unknown;
  try {
    datos = JSON.parse(crudo);
  } catch {
    throw new Error("La respuesta de Gemini no es un JSON valido.");
  }

  // Validacion manual: nunca confiamos ciegamente en lo que devuelve el modelo.
  if (
    typeof datos !== "object" ||
    datos === null ||
    !("titulo" in datos) ||
    typeof (datos as { titulo: unknown }).titulo !== "string"
  ) {
    throw new Error("Gemini no devolvio un titulo valido.");
  }

  const obj = datos as Record<string, unknown>;
  const titulo = String(obj.titulo).trim();
  const tipo = obj.tipo === "proyecto" ? "proyecto" : "tarea";

  let fecha: string | null = null;
  if (
    typeof obj.fecha === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(obj.fecha)
  ) {
    fecha = obj.fecha;
  }

  if (!titulo) {
    throw new Error("El titulo interpretado esta vacio.");
  }

  return { titulo, tipo, fecha };
}