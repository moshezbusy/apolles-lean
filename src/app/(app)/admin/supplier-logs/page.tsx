import { PageHeader } from "~/components/layout/page-header";

export default function AdminSupplierLogsPage() {
  return (
    <section>
      <PageHeader
        title="Supplier Logs"
        description="Supplier API diagnostics and request logs will be implemented in Epic 6."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-text-secondary">Admin supplier logs view placeholder.</p>
      </div>
    </section>
  );
}
