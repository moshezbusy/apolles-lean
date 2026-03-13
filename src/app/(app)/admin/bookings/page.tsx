import { PageHeader } from "~/components/layout/page-header";

export default function AdminBookingsPage() {
  return (
    <section>
      <PageHeader
        title="All Bookings"
        description="Admin-wide booking visibility and monitoring will be added in Epic 6."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-text-secondary">This page is reserved for admin booking oversight.</p>
      </div>
    </section>
  );
}
