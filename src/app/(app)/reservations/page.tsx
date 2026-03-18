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
import { AppError, ErrorCodes } from "~/lib/errors";

async function redirectToLoginWithCallback() {
  const requestHeaders = await headers();
  const callbackUrl = requestHeaders.get(REQUEST_CALLBACK_URL_HEADER) ?? DEFAULT_AUTHENTICATED_REDIRECT;

  redirect(buildLoginRedirectPath(callbackUrl));
}

export default async function ReservationsPage() {
  const session = await getValidatedSession();

  if (!session?.user || !session.user.id) {
    await redirectToLoginWithCallback();
  }

  let reservations;

  try {
    reservations = await listVisibleReservations(session);
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === ErrorCodes.NOT_AUTHENTICATED) {
        await redirectToLoginWithCallback();
      }

      if (error.code === ErrorCodes.NOT_AUTHORIZED) {
        redirect("/search");
      }
    }

    throw error;
  }

  return (
    <section>
      <PageHeader
        title="Reservations"
        description="Your signed-in reservations workspace, separate from the admin all-bookings view."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-text-secondary">
          Reservations stays scoped to bookings linked to the current signed-in account. Admin users can still
          open All Bookings from the sidebar when they need the cross-agent admin surface. Full filtering,
          sorting, and detail workflows arrive in Epic 5.
        </p>

        {reservations.length > 0 ? (
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
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-border-subtle bg-surface px-4 py-6">
            <p className="text-sm text-text-secondary">
              No reservations are linked to this account yet. Use All Bookings for the admin-wide booking
              view.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
