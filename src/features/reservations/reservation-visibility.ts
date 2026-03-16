import {
  type BookingScope,
  buildBookingScope,
  requireAuth,
  type SessionLike,
} from "~/lib/authorize";

export type ReservationVisibilityRecord = {
  id: string;
  bookingRef: string;
  hotelName: string;
  guestName: string;
  agentId: string;
  agentName: string;
  status: "confirmed" | "pending";
};

const reservationVisibilityFixtures: ReservationVisibilityRecord[] = [
  {
    id: "booking-1",
    bookingRef: "APL-1001",
    hotelName: "Coral Suites",
    guestName: "Leah Cohen",
    agentId: "agent-1",
    agentName: "Yael Agent",
    status: "confirmed",
  },
  {
    id: "booking-2",
    bookingRef: "APL-1002",
    hotelName: "Atlas Bay Hotel",
    guestName: "Daniel Levy",
    agentId: "agent-1",
    agentName: "Yael Agent",
    status: "pending",
  },
  {
    id: "booking-3",
    bookingRef: "APL-2001",
    hotelName: "Luma Resort",
    guestName: "Maya Azulay",
    agentId: "agent-2",
    agentName: "Noam Agent",
    status: "confirmed",
  },
];

export async function queryVisibleReservations(
  scope: BookingScope,
): Promise<ReservationVisibilityRecord[]> {
  if (scope.where?.agentId) {
    return reservationVisibilityFixtures.filter(
      (reservation) => reservation.agentId === scope.where?.agentId,
    );
  }

  return reservationVisibilityFixtures;
}

export async function listVisibleReservations(
  session: SessionLike,
): Promise<ReservationVisibilityRecord[]> {
  requireAuth(session);

  const scope = buildBookingScope(session);
  return queryVisibleReservations(scope);
}
