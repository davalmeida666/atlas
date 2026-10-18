import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/actions";
import {
  createProject,
  createTask,
  setTaskStatus,
  deleteTask,
  deleteProject,
} from "@/app/tasks-actions";

type Proyecto = {
  id: string;
  name: string;
  description: string | null;
  due_at: string | null;
};

type Tarea = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  due_at: string | null;
  project_id: string | null;
};

const ESTADOS: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
};

// Muestra una fecha en hora de Colombia, por ejemplo "12 may 2026".
function formatoFecha(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const campo = "rounded border border-gray-400 p-2 text-sm";
const boton = "rounded bg-blue-600 p-2 text-sm text-white hover:bg-blue-700";
const botonChico =
  "rounded border border-gray-400 px-2 py-1 text-xs hover:bg-gray-500/10";
const botonPeligro =
  "rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Segunda protección: aunque el guardia (proxy.ts) falle, aquí también se revisa.
  if (!user) {
    redirect("/login");
  }

  // Las reglas de seguridad (RLS) hacen que solo lleguen TUS filas.
  const respProyectos = await supabase
    .from("projects")
    .select("id, name, description, due_at")
    .order("created_at", { ascending: false });

  const respTareas = await supabase
    .from("tasks")
    .select("id, title, notes, status, due_at, project_id")
    .order("created_at", { ascending: false });

  const proyectos = (respProyectos.data ?? []) as Proyecto[];
  const tareas = (respTareas.data ?? []) as Tarea[];
  const errorLectura = respProyectos.error || respTareas.error;

  const nombreProyecto = new Map(proyectos.map((p) => [p.id, p.name]));

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ATLAS</h1>
          <p className="text-sm text-gray-500">Sesión iniciada como {user.email}</p>
        </div>
        <form>
          <button
            formAction={signout}
            className="rounded border border-gray-400 p-2 text-sm hover:bg-gray-500/10"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <p className="rounded bg-yellow-500/10 p-2 text-xs text-yellow-600">
        Pantalla provisional de la Fase 2: sirve para comprobar que los datos se guardan.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {errorLectura && (
        <p className="text-sm text-red-500">No se pudieron leer tus datos.</p>
      )}

      {/* PROYECTOS */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Proyectos</h2>

        <form className="flex flex-col gap-2 rounded-xl border border-gray-400 p-4">
          <input name="name" required maxLength={200} placeholder="Nombre del proyecto" className={campo} />
          <input name="description" placeholder="Descripción (opcional)" className={campo} />
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Fecha límite (opcional)
            <input name="due" type="date" className={campo} />
          </label>
          <button formAction={createProject} className={boton}>
            Crear proyecto
          </button>
        </form>

        {proyectos.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no tienes proyectos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {proyectos.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded border border-gray-400 p-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
                  {p.due_at && (
                    <p className="text-xs text-gray-500">Vence: {formatoFecha(p.due_at)}</p>
                  )}
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-red-500">Borrar proyecto</summary>
                  <form className="mt-2 flex flex-col gap-2">
                    <p className="text-gray-500">
                      Sus tareas no se borran: quedarán sin proyecto.
                    </p>
                    <input type="hidden" name="id" value={p.id} />
                    <button formAction={deleteProject} className={botonPeligro}>
                      Sí, borrar proyecto
                    </button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* TAREAS */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Tareas</h2>

        <form className="flex flex-col gap-2 rounded-xl border border-gray-400 p-4">
          <input name="title" required maxLength={300} placeholder="¿Qué necesitas hacer?" className={campo} />
          <textarea name="notes" placeholder="Notas (opcional)" rows={2} className={campo} />
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Proyecto (opcional)
            <select name="project_id" className={campo} defaultValue="">
              <option value="">Sin proyecto</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Fecha límite (opcional)
            <input name="due" type="date" className={campo} />
          </label>
          <button formAction={createTask} className={boton}>
            Crear tarea
          </button>
        </form>
        {tareas.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no tienes tareas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tareas.map((t) => (
              <li key={t.id} className="flex flex-col gap-2 rounded border border-gray-400 p-3">
                <div>
                  <p
                    className={
                      t.status === "completada"
                        ? "font-medium text-gray-500 line-through"
                        : "font-medium"
                    }
                  >
                    {t.title}
                  </p>
                  {t.notes && <p className="text-sm text-gray-500">{t.notes}</p>}
                  <p className="text-xs text-gray-500">
                    {ESTADOS[t.status] ?? t.status}
                    {t.project_id && nombreProyecto.get(t.project_id)
                      ? ` · ${nombreProyecto.get(t.project_id)}`
                      : ""}
                    {t.due_at ? ` · Vence: ${formatoFecha(t.due_at)}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex gap-2">
                    {t.status === "pendiente" && (
                      <form>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="status" value="en_progreso" />
                        <button formAction={setTaskStatus} className={botonChico}>
                          Iniciar
                        </button>
                      </form>
                    )}
                    {t.status !== "completada" && (
                      <form>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="status" value="completada" />
                        <button formAction={setTaskStatus} className={botonChico}>
                          Completar
                        </button>
                      </form>
                    )}
                    {t.status === "completada" && (
                      <form>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="status" value="pendiente" />
                        <button formAction={setTaskStatus} className={botonChico}>
                          Reabrir
                        </button>
                      </form>
                    )}
                  </div>

                  <details className="text-xs">
                    <summary className="cursor-pointer text-red-500">Borrar</summary>
                    <form className="mt-2">
                      <input type="hidden" name="id" value={t.id} />
                      <button formAction={deleteTask} className={botonPeligro}>
                        Sí, borrar tarea
                      </button>
                    </form>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}