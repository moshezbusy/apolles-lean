import { NextResponse } from "next/server";

const notImplemented = () =>
  NextResponse.json(
    { error: "Auth configuration will be implemented in Story 1.3" },
    { status: 501 },
  );

export const authHandlers = {
  GET: notImplemented,
  POST: notImplemented,
};
