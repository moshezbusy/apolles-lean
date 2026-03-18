import { describe, expect, it } from "vitest";
import {
  listAdminReservations,
  listVisibleReservations,
} from "~/features/reservations/reservation-visibility";
import { ErrorCodes } from "~/lib/errors";

function createSession(role: "ADMIN" | "AGENT", userId = "user-1") {
  return {
    user: {
      id: userId,
      role,
    },
  };
}

describe("listVisibleReservations", () => {
  it("scopes reservations to the signed-in account", async () => {
    const reservations = await listVisibleReservations(createSession("AGENT", "agent-1"));

    expect(reservations.map((reservation) => reservation.bookingRef)).toEqual([
      "APL-1001",
      "APL-1002",
    ]);
    expect(reservations.every((reservation) => reservation.agentId === "agent-1")).toBe(true);
  });

  it("keeps admin reservations scoped to the signed-in admin account rather than all bookings", async () => {
    await expect(listVisibleReservations(createSession("ADMIN", "admin-1"))).resolves.toEqual([]);
  });

  it("fails safely for invalid sessions", async () => {
    await expect(listVisibleReservations(null)).rejects.toMatchObject({
      code: ErrorCodes.NOT_AUTHENTICATED,
    });
  });

  it("requires explicit admin authorization for all-bookings access", async () => {
    await expect(listAdminReservations(createSession("AGENT", "agent-1"))).rejects.toMatchObject({
      code: ErrorCodes.NOT_AUTHORIZED,
    });

    await expect(listAdminReservations(createSession("ADMIN", "admin-1"))).resolves.toHaveLength(3);
  });
});
