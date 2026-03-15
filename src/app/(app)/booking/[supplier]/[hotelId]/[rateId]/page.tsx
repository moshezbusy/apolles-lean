import { PageHeader } from "~/components/layout/page-header";

type Props = {
  params: Promise<{
    supplier: string;
    hotelId: string;
    rateId: string;
  }>;
  searchParams: Promise<{
    checkIn?: string;
    checkOut?: string;
    adults?: string;
    rooms?: string;
    childAge?: string | string[];
    sourceLabel?: string;
  }>;
};

function toChildAgeList(childAge: string | string[] | undefined): string {
  if (!childAge) {
    return "None";
  }

  return Array.isArray(childAge) ? childAge.join(", ") : childAge;
}

export default async function BookingPlaceholderPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const query = await searchParams;
  const sourceLabel = query.sourceLabel?.trim() || "Selected source";

  return (
    <section className="space-y-6">
      <PageHeader
        title="Booking"
        description="Story 3.1 adds the minimal booking route scaffold needed for result-card navigation without pre-implementing Epic 4 flows."
      />

      <div className="rounded-2xl border border-border-subtle bg-card p-6 text-sm text-text-secondary">
        <p className="font-medium text-text-primary">Cheapest-rate context captured</p>
        <p className="mt-2">Source: {sourceLabel}</p>
        <p>Hotel ID: {routeParams.hotelId}</p>
        <p>Rate ID: {routeParams.rateId}</p>
        <p>Check-in: {query.checkIn ?? "Unknown"}</p>
        <p>Check-out: {query.checkOut ?? "Unknown"}</p>
        <p>Adults: {query.adults ?? "Unknown"}</p>
        <p>Rooms: {query.rooms ?? "Unknown"}</p>
        <p>Child ages: {toChildAgeList(query.childAge)}</p>
      </div>
    </section>
  );
}
