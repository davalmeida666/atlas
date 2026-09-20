import { login, signup } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-gray-400 p-6">
        <h1 className="text-2xl font-bold">ATLAS</h1>
        <p className="text-sm text-gray-500">Inicia sesión o crea tu cuenta.</p>

        <label className="flex flex-col gap-1 text-sm">
          Correo
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded border border-gray-400 p-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Contraseña (mínimo 8 caracteres)
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="rounded border border-gray-400 p-2"
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <button
          formAction={login}
          className="rounded bg-blue-600 p-2 text-white hover:bg-blue-700"
        >
          Iniciar sesión
        </button>
        <button
          formAction={signup}
          className="rounded border border-gray-400 p-2 hover:bg-gray-500/10"
        >
          Crear cuenta
        </button>
      </form>
    </main>
  );
}