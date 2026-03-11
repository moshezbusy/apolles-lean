export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-20">
      <section className="w-full max-w-3xl rounded-3xl border border-border bg-card p-10 shadow-sm">
        <p className="font-mono text-xs tracking-[0.2em] text-text-secondary uppercase">
          Baseline Ready
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
          Apolles Project Initialized
        </h1>
        <p className="mt-5 max-w-xl text-base text-text-secondary">
          Foundation setup is complete for the upcoming implementation stories.
        </p>
      </section>
    </main>
  );
}
