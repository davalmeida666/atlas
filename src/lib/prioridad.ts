export type Prioridad = "critica" | "alta" | "media" | "baja";

export type TareaConFecha = {
  due_at: string | null;
  status: string;
};

const ETIQUETAS: Record<Prioridad, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export function etiquetaPrioridad(p: Prioridad): string {
  return ETIQUETAS[p];
}

// Calcula un puntaje de 0 a 100 según la cercanía de la fecha límite.
// No usa IA: es una fórmula simple y predecible, a propósito.
export function calcularPuntaje(tarea: TareaConFecha, ahora: Date = new Date()): number {
  // Una tarea completada ya no compite por prioridad.
  if (tarea.status === "completada") return 0;

  if (!tarea.due_at) return 10;

  const vencimiento = new Date(tarea.due_at);
  const msPorDia = 1000 * 60 * 60 * 24;
  const diasRestantes = (vencimiento.getTime() - ahora.getTime()) / msPorDia;

  if (diasRestantes < 0) return 100;
  if (diasRestantes <= 1) return 85;
  if (diasRestantes <= 3) return 65;
  if (diasRestantes <= 7) return 45;
  return 25;
}

export function puntajeAPrioridad(puntaje: number): Prioridad {
  if (puntaje >= 85) return "critica";
  if (puntaje >= 65) return "alta";
  if (puntaje >= 45) return "media";
  return "baja";
}

export function prioridadDe(tarea: TareaConFecha, ahora: Date = new Date()): {
  puntaje: number;
  nivel: Prioridad;
  etiqueta: string;
} {
  const puntaje = calcularPuntaje(tarea, ahora);
  const nivel = puntajeAPrioridad(puntaje);
  return { puntaje, nivel, etiqueta: etiquetaPrioridad(nivel) };
}
