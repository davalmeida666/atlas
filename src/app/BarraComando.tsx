"use client";

import { useState } from "react";
import { interpretarTextoAction } from "./interprete-action";
import { createFromInterpretation } from "./tasks-actions";

type Interpretado = {
  titulo: string;
  tipo: "tarea" | "proyecto";
  fecha: string | null;
};

const campo = "rounded border border-gray-400 p-2 text-sm";
const boton = "rounded bg-blue-600 p-2 text-sm text-white hover:bg-blue-700";

export default function BarraComando({ proyectos }: { proyectos: { id: string; name: string }[] }) {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<Interpretado | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function interpretar() {
    setCargando(true);
    setError("");
    setResultado(null);
    try {
      const data = await interpretarTextoAction(texto);
      setResultado(data);
    } catch (e) {
      setError((e as Error).message || "No se pudo interpretar el texto.");
    } finally {
      setCargando(false);
    }
  }

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
        <div className="flex flex-col gap-2 rounded border border-gray-400 bg-white p-3 text-sm dark:bg-black">
          <p>
            Entendí: <strong>{resultado.titulo}</strong>
            {" · "}
            {resultado.tipo === "proyecto" ? "Proyecto" : "Tarea"}
            {resultado.fecha ? ` · Vence: ${resultado.fecha}` : " · Sin fecha"}
          </p>
          <div className="flex gap-2">
            <form
              onSubmit={() => {
                setResultado(null);
                setTexto("");
              }}
            >
              <input type="hidden" name="titulo" value={resultado.titulo} />
              <input type="hidden" name="tipo" value={resultado.tipo} />
              <input type="hidden" name="fecha" value={resultado.fecha ?? ""} />
              <button formAction={createFromInterpretation} className={boton}>
                Crear
              </button>
            </form>
            <button
              onClick={() => {
                setResultado(null);
              }}
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