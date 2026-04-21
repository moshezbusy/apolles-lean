# Page Specs

## `/login`

Purpose: Authenticate users and provide a focused entry point into the platform.

Primary action: Sign in.

Key UI areas:

1. Branded left-side panel
2. Login card with credentials form
3. Compact supporting access/help text

## `/home`

Purpose: Serve as the main inner-app visual anchor and search-oriented dashboard.

Primary action: Start a hotel search.

Key UI areas:

1. Top navigation
2. Search header and search bar
3. Filters and recent searches
4. Business overview and summary stats

## `/search-results`

Purpose: Let agents scan hotel options quickly after a search.

Primary action: Select a hotel or proceed deeper into room options.

Key UI areas:

1. Compact search bar
2. Filter sidebar
3. Results header with count and sort
4. Hotel result cards
5. Empty and loading states

## `/search-results/hotel-rooms`

Purpose: Present the selected hotel's room inventory and rate options.

Primary action: Choose a room to book.

Key UI areas:

1. Compact search bar
2. Hotel summary
3. Room filters
4. Sort controls
5. Room cards and availability states

## `/booking`

Purpose: Capture traveler details required to place a reservation.

Primary action: Continue to booking review.

Key UI areas:

1. Page header
2. Guest details form
3. Special requests area
4. Cancellation policy section
5. Booking summary sidebar

## `/booking/summary`

Purpose: Let agents verify booking details before final confirmation.

Primary action: Confirm booking.

Key UI areas:

1. Back navigation and review header
2. Hotel and room summary
3. Guest details review
4. Cancellation policy
5. Terms and confirmation controls
6. Pricing summary sidebar

## `/booking/confirmation`

Purpose: Confirm success and present the final reservation reference.

Primary action: View reservation details or return to the app.

Key UI areas:

1. Success banner with confirmation number
2. Reservation details summary
3. Guest and stay information
4. Cancellation and pricing sections
5. Next-step actions

## `/reservations`

Purpose: Help agents review, filter, and manage reservation records.

Primary action: Open a reservation record.

Key UI areas:

1. Page header and summary metrics
2. Search, filters, and date controls
3. Reservation list or table
4. Status indicators and supplier information
5. Empty states and quick actions

## `/reservations/[id]`

Purpose: Show the full operational detail for a single reservation.

Primary action: Review, export, or act on the reservation record.

Key UI areas:

1. Back navigation and reservation header
2. Hotel and room detail summary
3. Guest information
4. Cancellation policy
5. Pricing and booking reference details
6. Action panel for export, print, or follow-up actions
