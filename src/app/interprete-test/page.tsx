"use client";

import { useState } from "react";
import { interpretarTextoAction } from "./actions";

export default function InterpreteTestPage() {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<string>("");
  const [cargando, setCargando] = useState(false);

  async function probar() {
    setCargando(true);
    setResultado("");
    try {
      const data = await interpretarTextoAction(texto);
      setResultado(JSON.stringify(data, null, 2));
    } catch (e) {
      setResultado("ERROR: " + (e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 600 }}>
      <h1>Prueba del intérprete (temporal)</h1>
      <p>Escribe algo como: &quot;hacer trabajo de ética para el martes&quot;</p>
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        style={{ width: "100%", padding: 8, marginTop: 8 }}
      />
      <button
        onClick={probar}
        disabled={cargando || !texto}
        style={{ marginTop: 8, padding: "8px 16px" }}
      >
        {cargando ? "Interpretando..." : "Interpretar"}
      </button>
      <pre style={{ marginTop: 16, background: "#eee", padding: 12 }}>
        {resultado}
      </pre>
    </main>
  );
}