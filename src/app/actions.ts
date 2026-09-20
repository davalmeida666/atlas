"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Lee el correo y la contraseña del formulario.
function leerFormulario(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

// Inicia sesión con un usuario que ya existe.
export async function login(formData: FormData) {
  const supabase = await createClient();
  const { email, password } = leerFormulario(formData);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=" + encodeURIComponent("Correo o contraseña incorrectos."));
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// Crea una cuenta nueva.
export async function signup(formData: FormData) {
  const supabase = await createClient();
  const { email, password } = leerFormulario(formData);

  if (password.length < 8) {
    redirect("/login?error=" + encodeURIComponent("La contraseña debe tener al menos 8 caracteres."));
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }

  // Si la confirmación de correo sigue activa, no hay sesión todavía.
  if (!data.session) {
    redirect(
      "/login?message=" +
        encodeURIComponent("Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.")
    );
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// Cierra la sesión.
export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}