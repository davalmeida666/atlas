"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

// Crea un proyecto nuevo.
export async function createProject(formData: FormData) {
  const supabase = await createClient();

  const name = texto(formData, "name");
  if (!name) {
    redirect("/?error=" + encodeURIComponent("El proyecto necesita un nombre."));
  }

  const { error } = await supabase.from("projects").insert({
    name,
    description: texto(formData, "description") || null,
    due_at: fechaLimite(texto(formData, "due")),
  });

  if (error) {
    console.error("createProject:", error.message);
    redirect("/?error=" + encodeURIComponent("No se pudo crear el proyecto."));
  }

  revalidatePath("/");
  redirect("/");
}

// Crea una tarea nueva, con proyecto opcional.
export async function createTask(formData: FormData) {
  const supabase = await createClient();

  const title = texto(formData, "title");
  if (!title) {
    redirect("/?error=" + encodeURIComponent("La tarea necesita un título."));
  }

  const { error } = await supabase.from("tasks").insert({
    title,
    notes: texto(formData, "notes") || null,
    project_id: texto(formData, "project_id") || null,
    due_at: fechaLimite(texto(formData, "due")),
  });

  if (error) {
    console.error("createTask:", error.message);
    redirect("/?error=" + encodeURIComponent("No se pudo crear la tarea."));
  }

  revalidatePath("/");
  redirect("/");
}