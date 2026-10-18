import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export type TareaInterpretada = {
  titulo: string;
  tipo: "tarea" | "proyecto";
  fecha: string | null; // formato AAAA-MM-DD, o null si no detectó fecha
  subtareas: string[]; // vacío si tipo es "tarea", o si no se pudieron proponer
  ambito: string | null; // nombre EXACTO de uno de los ámbitos recibidos, o null
};

// Le pide a Gemini que devuelva SIEMPRE este formato exacto.
const INSTRUCCIONES = `Eres el interprete de ATLAS, un asistente de tareas.
Recibes una frase en español de un estudiante y devuelves SOLO un JSON,
sin texto adicional, sin backticks de markdown, con esta forma exacta:

{"titulo": string, "tipo": "tarea" o "proyecto", "fecha": "AAAA-MM-DD" o null, "subtareas": string[], "ambito": string o null}

Reglas:
- "titulo": un resumen corto y claro de lo que hay que hacer.
- "tipo": "proyecto" solo si implica varias etapas grandes (un corto, una app,
  una investigacion larga). Si no estas seguro, usa "tarea".
- "fecha": si el texto menciona un dia (hoy, manana, el martes, el 15 de mayo),
  calcula la fecha real usando la FECHA DE HOY que te doy abajo. Si no hay
  ninguna fecha mencionada, usa null. Nunca inventes una fecha que no este
  implicada por el texto.
- "subtareas": SOLO si "tipo" es "proyecto", propone entre 3 y 8 pasos cortos,
  en orden logico, para completarlo. Si "tipo" es "tarea", "subtareas" debe
  ser un arreglo vacio: [].
- "ambito": elige, de la lista de AMBITOS DISPONIBLES que te doy abajo, el que
  mejor encaje con el texto. Debes copiar el nombre EXACTO tal como aparece
  en la lista, letra por letra. Si ninguno encaja bien, usa null. NUNCA
  inventes un nombre de ambito que no este en la lista.`;
export async function interpretarTexto(
  texto: string,
  hoyISO: string, // formato AAAA-MM-DD, ej. "2026-10-18"
  ambitosDisponibles: string[]
): Promise<TareaInterpretada> {
   const listaAmbitos =
    ambitosDisponibles.length > 0 ? ambitosDisponibles.join(", ") : "(ninguno todavía)";

  const respuesta = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `FECHA DE HOY: ${hoyISO}\n\nAMBITOS DISPONIBLES: ${listaAmbitos}\n\nFRASE DEL USUARIO: "${texto}"`,
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

  // Validamos las subtareas: deben ser texto, no vacias, y como mucho 8.
  let subtareas: string[] = [];
  if (tipo === "proyecto" && Array.isArray(obj.subtareas)) {
    subtareas = obj.subtareas
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim())
      .slice(0, 8);
  }

   let ambito: string | null = null;
  if (typeof obj.ambito === "string" && ambitosDisponibles.includes(obj.ambito)) {
    ambito = obj.ambito;
  }

  return { titulo, tipo, fecha, subtareas, ambito };
}