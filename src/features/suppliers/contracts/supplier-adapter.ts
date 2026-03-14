import type {
  BookingResult,
  PriceCheckResult,
  SupplierId,
  SupplierRoomDetail,
  SupplierSearchResult,
} from "~/features/suppliers/contracts/supplier-schemas";

export type SupplierSearchInput = {
  destination: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  childrenAges: number[];
};

export type SupplierRoomDetailsInput = {
  supplierHotelId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  childrenAges: number[];
};

export type SupplierPriceCheckInput = {
  supplierHotelId: string;
  rateId: string;
  checkIn: string;
  checkOut: string;
};

export type SupplierBookInput = {
  supplierHotelId: string;
  rateId: string;
  guests: Array<{
    fullName: string;
    email?: string;
    phone?: string;
  }>;
  specialRequests?: string;
  paymentToken?: string;
  idempotencyKey: string;
};

export type SupplierCancelInput = {
  supplierBookingReference: string;
  reason?: string;
};

export type SupplierGetBookingDetailInput = {
  supplierBookingReference: string;
};

export interface SupplierAdapter {
  readonly supplier: SupplierId;

  search(input: SupplierSearchInput): Promise<SupplierSearchResult[]>;
  getRoomDetails(input: SupplierRoomDetailsInput): Promise<SupplierRoomDetail>;
  recheckPrice(input: SupplierPriceCheckInput): Promise<PriceCheckResult>;
  book(input: SupplierBookInput): Promise<BookingResult>;

  // Forward-compatible methods (Late MVP)
  cancel(input: SupplierCancelInput): Promise<{ cancelled: boolean; message?: string }>;
  getBookingDetail(input: SupplierGetBookingDetailInput): Promise<BookingResult>;
}
