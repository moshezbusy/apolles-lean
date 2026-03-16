import React from "react";

import { PageHeader } from "~/components/layout/page-header";
import { listVisibleReservations } from "~/features/reservations/reservation-visibility";
import { getValidatedSession } from "~/lib/auth";

export default async function AdminBookingsPage() {
  const session = await getValidatedSession();
  const reservations = await listVisibleReservations(session);

  return (
    <section>
      <PageHeader
        title="All Bookings"
        description="Current admin booking visibility aligned with Story 1.5 authorization rules."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-text-secondary">
          Admin users can review bookings without agent scoping here. Full admin filters and booking management
          tooling arrive in Epic 6.
        </p>

        <ul className="mt-4 space-y-3" aria-label="Admin-visible bookings">
          {reservations.map((reservation) => (
            <li
              key={reservation.id}
              className="rounded-lg border border-border-subtle bg-surface px-4 py-3"
            >
              <p className="font-medium text-text-primary">{reservation.bookingRef}</p>
              <p className="text-sm text-text-secondary">
                {reservation.agentName} - {reservation.hotelName} - {reservation.guestName}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
