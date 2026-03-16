import { describe, expect, it, vi } from "vitest";

import * as authorize from "~/lib/authorize";
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
  it("uses buildBookingScope in runtime code and scopes agent results", async () => {
    const buildBookingScopeSpy = vi.spyOn(authorize, "buildBookingScope");

    const reservations = await listVisibleReservations(createSession("AGENT", "agent-1"));

    expect(buildBookingScopeSpy).toHaveBeenCalledOnce();
    expect(reservations.map((reservation) => reservation.bookingRef)).toEqual([
      "APL-1001",
      "APL-1002",
    ]);
    expect(reservations.every((reservation) => reservation.agentId === "agent-1")).toBe(true);
  });

  it("rejects admin sessions so all-bookings access stays behind the admin boundary", async () => {
    await expect(listVisibleReservations(createSession("ADMIN", "admin-1"))).rejects.toMatchObject({
      code: ErrorCodes.NOT_AUTHORIZED,
    });
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
