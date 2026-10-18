"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ESTADOS_VALIDOS = ["pendiente", "en_progreso", "completada"];

// Lee un campo de texto del formulario y le quita espacios sobrantes.
function texto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "").trim();
}

// TEMPORAL: convierte la fecha del formulario (AAAA-MM-DD) en las 23:59
// hora de Colombia (UTC-5). Más adelante usaremos la zona horaria del usuario.
function fechaLimite(valor: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  return `${valor}T23:59:00-05:00`;
}

// Vuelve a la página principal mostrando un mensaje de error.
function volverConError(mensaje: string): never {
  redirect("/?error=" + encodeURIComponent(mensaje));
}

// Crea un proyecto nuevo.
export async function createProject(formData: FormData) {
  const supabase = await createClient();

  const name = texto(formData, "name");
  if (!name) volverConError("El proyecto necesita un nombre.");

  const { error } = await supabase.from("projects").insert({
    name,
    description: texto(formData, "description") || null,
    due_at: fechaLimite(texto(formData, "due")),
  });

  if (error) {
    console.error("createProject:", error.message);
    volverConError("No se pudo crear el proyecto.");
  }

  revalidatePath("/");
  redirect("/");
}

// Crea una tarea nueva, con proyecto opcional.
export async function createTask(formData: FormData) {
  const supabase = await createClient();

  const title = texto(formData, "title");
  if (!title) volverConError("La tarea necesita un título.");

  const { error } = await supabase.from("tasks").insert({
    title,
    notes: texto(formData, "notes") || null,
    project_id: texto(formData, "project_id") || null,
    due_at: fechaLimite(texto(formData, "due")),
  });

  if (error) {
    console.error("createTask:", error.message);
    volverConError("No se pudo crear la tarea.");
  }

  revalidatePath("/");
  redirect("/");
}

// Cambia el estado de una tarea (pendiente, en_progreso o completada).
export async function setTaskStatus(formData: FormData) {
  const supabase = await createClient();

  const id = texto(formData, "id");
  const status = texto(formData, "status");
  if (!id || !ESTADOS_VALIDOS.includes(status)) {
    volverConError("No se pudo cambiar el estado.");
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "completada" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    console.error("setTaskStatus:", error.message);
    volverConError("No se pudo cambiar el estado.");
  }

  revalidatePath("/");
  redirect("/");
}

// Borra una tarea (y sus subtareas, si las tuviera).
export async function deleteTask(formData: FormData) {
  const supabase = await createClient();

  const id = texto(formData, "id");
  if (!id) volverConError("No se pudo borrar la tarea.");

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    console.error("deleteTask:", error.message);
    volverConError("No se pudo borrar la tarea.");
  }

  revalidatePath("/");
  redirect("/");
}

// Borra un proyecto. Sus tareas NO se borran: quedan "sin proyecto".
export async function deleteProject(formData: FormData) {
  const supabase = await createClient();

  const id = texto(formData, "id");
  if (!id) volverConError("No se pudo borrar el proyecto.");

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    console.error("deleteProject:", error.message);
    volverConError("No se pudo borrar el proyecto.");
  }

  revalidatePath("/");
  redirect("/");
}


// Crea una tarea o proyecto a partir de lo que interpretó la IA,
// junto con las subtareas que el usuario dejó marcadas (si las hay).
// El usuario ya vio y confirmó esta información antes de llamar a esto.
export async function createFromInterpretation(formData: FormData) {
  const supabase = await createClient();

  const titulo = texto(formData, "titulo");
  const tipo = texto(formData, "tipo");
  const fechaPlano = texto(formData, "fecha"); // AAAA-MM-DD o vacío
    const subtareasTexto = texto(formData, "subtareas"); // separadas por saltos de línea
  const scopeId = texto(formData, "scope_id") || null;

  if (!titulo) volverConError("No hay título para guardar.");

  const due = fechaPlano ? fechaLimite(fechaPlano) : null;

  const subtareas = subtareasTexto
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (tipo === "proyecto") {
    // Paso 1: crear el proyecto y leer su id.
    const { data: proyectoCreado, error: errorProyecto } = await supabase
      .from("projects")
            .insert({ name: titulo, due_at: due, scope_id: scopeId })
      .select("id")
      .single();

    if (errorProyecto || !proyectoCreado) {
      console.error("createFromInterpretation(proyecto):", errorProyecto?.message);
      volverConError("No se pudo crear el proyecto.");
    }

    // Paso 2: crear cada subtarea, ligada a ese proyecto.
    if (subtareas.length > 0) {
      const filas = subtareas.map((title) => ({
        title,
        project_id: proyectoCreado.id,
      }));

      const { error: errorSubtareas } = await supabase.from("tasks").insert(filas);

      if (errorSubtareas) {
        console.error("createFromInterpretation(subtareas):", errorSubtareas.message);
        // El proyecto ya se creó; avisamos pero no revertimos nada,
        // para no borrar algo que el usuario sí alcanzó a ver creado.
        volverConError("El proyecto se creó, pero no se pudieron guardar las subtareas.");
      }
    }
  } else {
        const { error } = await supabase.from("tasks").insert({
      title: titulo,
      due_at: due,
      scope_id: scopeId,
    });
    if (error) {
      console.error("createFromInterpretation(tarea):", error.message);
      volverConError("No se pudo crear la tarea.");
    }
  }

  revalidatePath("/");
  redirect("/");
}

// Crea un ámbito nuevo, a mano (el usuario siempre decide crearlos).
export async function createScope(formData: FormData) {
  const supabase = await createClient();

  const name = texto(formData, "name");
  if (!name) volverConError("El ámbito necesita un nombre.");

  const { error } = await supabase.from("scopes").insert({ name });

  if (error) {
    console.error("createScope:", error.message);
    if (error.code === "23505") {
      // Código de Postgres para "ya existe" (viola la regla unique).
      volverConError("Ya tienes un ámbito con ese nombre.");
    }
    volverConError("No se pudo crear el ámbito.");
  }

  revalidatePath("/");
  redirect("/");
}

// Borra un ámbito. Sus proyectos y tareas NO se borran: quedan sin ámbito.
export async function deleteScope(formData: FormData) {
  const supabase = await createClient();

  const id = texto(formData, "id");
  if (!id) volverConError("No se pudo borrar el ámbito.");

  const { error } = await supabase.from("scopes").delete().eq("id", id);

  if (error) {
    console.error("deleteScope:", error.message);
    volverConError("No se pudo borrar el ámbito.");
  }

  revalidatePath("/");
  redirect("/");
}

// Asigna (o quita) el ámbito de un proyecto existente.
export async function setProjectScope(formData: FormData) {
  const supabase = await createClient();

  const id = texto(formData, "id");
  const scopeId = texto(formData, "scope_id") || null;
  if (!id) volverConError("No se pudo asignar el ámbito.");

  const { error } = await supabase
    .from("projects")
    .update({ scope_id: scopeId })
    .eq("id", id);

  if (error) {
    console.error("setProjectScope:", error.message);
    volverConError("No se pudo asignar el ámbito.");
  }

  revalidatePath("/");
  redirect("/");
}

// Asigna (o quita) el ámbito de una tarea existente.
export async function setTaskScope(formData: FormData) {
  const supabase = await createClient();

  const id = texto(formData, "id");
  const scopeId = texto(formData, "scope_id") || null;
  if (!id) volverConError("No se pudo asignar el ámbito.");

  const { error } = await supabase
    .from("tasks")
    .update({ scope_id: scopeId })
    .eq("id", id);

  if (error) {
    console.error("setTaskScope:", error.message);
    volverConError("No se pudo asignar el ámbito.");
  }

  revalidatePath("/");
  redirect("/");
}