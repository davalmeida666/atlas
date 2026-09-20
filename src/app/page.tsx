import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Segunda protección: aunque el guardia (proxy.ts) falle, aquí también se revisa.
  if (!user) {
    redirect("/login");
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>ATLAS</h1>
      <p>Sesión iniciada como {user.email}</p>
      <form style={{ marginTop: 16 }}>
        <button
          formAction={signout}
          style={{ padding: "8px 16px", border: "1px solid gray", borderRadius: 6 }}
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}