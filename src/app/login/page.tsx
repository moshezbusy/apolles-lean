import { LoginForm } from "~/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-20">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="font-mono text-xs tracking-[0.2em] text-text-secondary uppercase">
          Apolles
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">
          Agent Sign In
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Use your admin-provided credentials to access the platform.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
