import Image from "next/image";
import Link from "next/link";
import { MapPinIcon, StarIcon } from "lucide-react";

import { buttonVariants } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import {
  buildBookHref,
  buildHotelAriaLabel,
  buildViewRoomsHref,
  formatCancellationBadge,
  formatResultPrice,
  getDisplayPrice,
  getPrimaryHotelImage,
  getVisibleStarCount,
} from "~/features/search/result-card-helpers";
import { SourceIndicatorBadge } from "~/features/search/source-indicator-badge";
import { getSourceLabel, type SourceLabelMap } from "~/features/search/source-labels";
import type { SupplierSearchInput } from "~/features/suppliers/contracts/supplier-adapter";
import type { SupplierSearchResult } from "~/features/suppliers/contracts/supplier-schemas";

type Props = {
  hotel: SupplierSearchResult;
  searchInput: SupplierSearchInput;
  sourceLabels: SourceLabelMap;
};

export function HotelResultCard({ hotel, searchInput, sourceLabels }: Props) {
  const displayAmount = getDisplayPrice(hotel);
  const displayPrice = formatResultPrice(displayAmount, hotel.lowestRate.currency);
  const sourceLabel = getSourceLabel(hotel.supplier, sourceLabels);
  const primaryImage = getPrimaryHotelImage(hotel);
  const cancellationBadge = formatCancellationBadge(hotel.lowestRate.cancellationPolicy);
  const viewRoomsHref = buildViewRoomsHref(hotel, searchInput, sourceLabel);
  const bookHref = buildBookHref(hotel, searchInput, sourceLabel);
  const visibleStars = getVisibleStarCount(hotel.starRating);

  return (
    <Card className="border border-border-subtle py-0">
      <article aria-label={buildHotelAriaLabel(hotel)} className="flex h-full flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={`${hotel.hotelName} primary image`}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-linear-to-br from-muted via-muted to-card text-sm font-medium text-text-secondary">
              No image available
            </div>
          )}
        </div>

        <CardHeader className="space-y-3 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <SourceIndicatorBadge label={sourceLabel} />
            <Badge variant="outline" className="border-border-subtle bg-background text-text-secondary">
              {hotel.lowestRate.mealPlan}
            </Badge>
            <Badge variant="outline" className="border-border-subtle bg-background text-text-secondary">
              {cancellationBadge}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1 text-amber-500" aria-hidden="true">
              {Array.from({ length: visibleStars }).map((_, index) => (
                <StarIcon key={index} className="size-4 fill-current" />
              ))}
            </div>
            <p className="sr-only">{hotel.starRating} out of 5 stars</p>
            <CardTitle className="text-base font-semibold">{hotel.hotelName}</CardTitle>
          </div>

          {hotel.address ? (
            <p className="flex items-start gap-2 text-sm text-text-secondary">
              <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{hotel.address}</span>
            </p>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-3 pb-4">
          <p className="text-sm text-text-secondary">{hotel.lowestRate.roomName}</p>
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-[0.08em] text-text-secondary uppercase">Starting from</p>
            <p className="font-mono text-2xl font-bold text-text-primary">{displayPrice}</p>
          </div>
        </CardContent>

        <CardFooter className="mt-auto flex flex-col gap-2 border-t border-border-subtle bg-background/60 sm:flex-row">
          <Link
            href={viewRoomsHref}
            aria-label={`View rooms at ${hotel.hotelName}`}
            className={buttonVariants({ className: "w-full" })}
          >
            View Rooms
          </Link>
          <Link
            href={bookHref}
            aria-label={`Book ${hotel.hotelName}`}
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Book
          </Link>
        </CardFooter>
      </article>
    </Card>
  );
}
