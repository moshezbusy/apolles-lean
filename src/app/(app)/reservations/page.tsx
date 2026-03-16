import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageHeader } from "~/components/layout/page-header";
import { listVisibleReservations } from "~/features/reservations/reservation-visibility";
import { getValidatedSession } from "~/lib/auth";
import {
  buildLoginRedirectPath,
  DEFAULT_AUTHENTICATED_REDIRECT,
  REQUEST_CALLBACK_URL_HEADER,
} from "~/lib/auth-routing";

export default async function ReservationsPage() {
  const session = await getValidatedSession();

  if (!session?.user) {
    const requestHeaders = await headers();
    const callbackUrl = requestHeaders.get(REQUEST_CALLBACK_URL_HEADER) ?? DEFAULT_AUTHENTICATED_REDIRECT;

    redirect(buildLoginRedirectPath(callbackUrl));
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin/bookings");
  }

  const reservations = await listVisibleReservations(session);

  return (
    <section>
      <PageHeader
        title="Reservations"
        description="Agent-only reservations workspace for your own bookings."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-text-secondary">
          This route is only for agents reviewing their own reservations. Admins are redirected to
          /admin/bookings for all-bookings access. Full filtering, sorting, and detail workflows arrive in
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
