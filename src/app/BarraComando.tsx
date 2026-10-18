"use client";

import { useState } from "react";
import { interpretarTextoAction } from "./interprete-action";
import { createFromInterpretation } from "./tasks-actions";

type Interpretado = {
  titulo: string;
  tipo: "tarea" | "proyecto";
  fecha: string | null;
  subtareas: string[];
};

const campo = "rounded border border-gray-400 p-2 text-sm";
const boton = "rounded bg-blue-600 p-2 text-sm text-white hover:bg-blue-700";

export default function BarraComando({ proyectos }: { proyectos: { id: string; name: string }[] }) {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<Interpretado | null>(null);
  const [seleccionadas, setSeleccionadas] = useState<boolean[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function interpretar() {
    setCargando(true);
    setError("");
    setResultado(null);
    try {
      const data = await interpretarTextoAction(texto);
      setResultado(data);
      // Por defecto, todas las subtareas empiezan marcadas.
      setSeleccionadas(data.subtareas.map(() => true));
    } catch (e) {
      setError((e as Error).message || "No se pudo interpretar el texto.");
    } finally {
      setCargando(false);
    }
  }

  function alternarSubtarea(indice: number) {
    setSeleccionadas((prev) => prev.map((marcada, i) => (i === indice ? !marcada : marcada)));
  }

  function limpiar() {
    setResultado(null);
    setSeleccionadas([]);
    setTexto("");
  }

  const subtareasElegidas = resultado
    ? resultado.subtareas.filter((_, i) => seleccionadas[i])
    : [];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-blue-400 bg-blue-500/5 p-4">
      <label className="text-sm font-medium">¿Qué necesitas hacer?</label>
      <div className="flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !cargando && texto && interpretar()}
          placeholder='Ej: "trabajo de ética para el martes"'
          className={campo + " flex-1"}
        />
        <button onClick={interpretar} disabled={cargando || !texto} className={boton}>
          {cargando ? "Pensando..." : "Interpretar"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {resultado && (
        <div className="flex flex-col gap-3 rounded border border-gray-400 bg-white p-3 text-sm dark:bg-black">
          
          <p>
            Entendí: <strong>{resultado.titulo}</strong>
            {" · "}
            {resultado.tipo === "proyecto" ? "Proyecto" : "Tarea"}
            {resultado.fecha ? ` · Vence: ${resultado.fecha}` : " · Sin fecha"}
          </p>

          {resultado.tipo === "proyecto" && resultado.subtareas.length > 0 && (
            <div className="flex flex-col gap-1 rounded bg-gray-500/5 p-2">
              <p className="text-xs text-gray-500">
                Subtareas propuestas (desmarca las que no quieras crear):
              </p>
              {resultado.subtareas.map((sub, i) => (
                <label key={i} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={seleccionadas[i] ?? false}
                    onChange={() => alternarSubtarea(i)}
                  />
                  {sub}
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <form onSubmit={limpiar}>
              <input type="hidden" name="titulo" value={resultado.titulo} />
              <input type="hidden" name="tipo" value={resultado.tipo} />
              <input type="hidden" name="fecha" value={resultado.fecha ?? ""} />
              <input type="hidden" name="subtareas" value={subtareasElegidas.join("\n")} />
              <button formAction={createFromInterpretation} className={boton}>
                Crear
              </button>
            </form>
            <button
              onClick={limpiar}
              className="rounded border border-gray-400 p-2 text-sm hover:bg-gray-500/10"
            >
              Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}