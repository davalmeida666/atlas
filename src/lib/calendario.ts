export type ItemCalendario = {
  id: string;
  titulo: string;
  tipo: "tarea" | "proyecto";
  due_at: string;
};

export type DiaAgenda = {
  fechaISO: string;
  esHoy: boolean;
  items: ItemCalendario[];
};

const ZONA_COLOMBIA = "America/Bogota";

function fechaISOEnZona(fecha: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_COLOMBIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

// Arma los próximos N días (incluyendo hoy), en hora de Colombia,
// y agrupa en cada uno los items cuya fecha caiga ahí.
export function agruparPorDia(
  items: ItemCalendario[],
  dias: number = 14,
  ahora: Date = new Date()
): DiaAgenda[] {
  const hoyISO = fechaISOEnZona(ahora);
  const [anio, mes, dia] = hoyISO.split("-").map(Number);
  const inicioUTC = Date.UTC(anio, mes - 1, dia);

  return Array.from({ length: dias }, (_, indice) => {
    const fechaISO = new Date(inicioUTC + indice * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const itemsDelDia = items.filter(
      (item) => fechaISOEnZona(new Date(item.due_at)) === fechaISO
    );

    return {
      fechaISO,
      esHoy: fechaISO === hoyISO,
      items: itemsDelDia,
    };
  });
}

// Formatea AAAA-MM-DD en algo legible, por ejemplo "lunes 20 de octubre".
export function formatoDiaLargo(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia, 12));
  return fecha.toLocaleDateString("es-CO", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
