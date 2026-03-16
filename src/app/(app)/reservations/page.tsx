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
        description="Current reservation visibility aligned with Story 1.5 authorization rules."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-text-secondary">
          Reservations shown here are limited to the authenticated agent. Full filtering, sorting, and detail
          workflows arrive in Epic 5.
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
