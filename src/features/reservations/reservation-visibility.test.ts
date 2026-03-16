import { describe, expect, it, vi } from "vitest";

import * as authorize from "~/lib/authorize";
import { listVisibleReservations } from "~/features/reservations/reservation-visibility";
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

  it("returns unscoped reservations for admins", async () => {
    const reservations = await listVisibleReservations(createSession("ADMIN", "admin-1"));

    expect(reservations.map((reservation) => reservation.bookingRef)).toEqual([
      "APL-1001",
      "APL-1002",
      "APL-2001",
    ]);
  });

  it("fails safely for invalid sessions", async () => {
    await expect(listVisibleReservations(null)).rejects.toMatchObject({
      code: ErrorCodes.NOT_AUTHENTICATED,
    });
  });
});
