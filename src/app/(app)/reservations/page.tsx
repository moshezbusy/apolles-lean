import React from "react";

import { PageHeader } from "~/components/layout/page-header";
import { listVisibleReservations } from "~/features/reservations/reservation-visibility";
import { getValidatedSession } from "~/lib/auth";

export default async function ReservationsPage() {
  const session = await getValidatedSession();
  const reservations = await listVisibleReservations(session);

  return (
    <section>
      <PageHeader
        title="Reservations"
        description="Minimal live reservation visibility for Story 1.5 authorization proof."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-text-secondary">
          This lean runtime slice proves agent-scoped reservation access. Full reservations tooling remains in
          Epic 5.
        </p>

        <ul className="mt-4 space-y-3" aria-label="Visible reservations">
          {reservations.map((reservation) => (
            <li
              key={reservation.id}
              className="rounded-lg border border-border-subtle bg-surface px-4 py-3"
            >
              <p className="font-medium text-text-primary">{reservation.bookingRef}</p>
              <p className="text-sm text-text-secondary">
                {reservation.hotelName} - {reservation.guestName}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
