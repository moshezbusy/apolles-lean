import { PageHeader } from "~/components/layout/page-header";

export default function ReservationsPage() {
  return (
    <section>
      <PageHeader
        title="Reservations"
        description="Track confirmed bookings and reservation status from one place."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-text-secondary">Reservations list will be implemented in Epic 5.</p>
      </div>
    </section>
  );
}
