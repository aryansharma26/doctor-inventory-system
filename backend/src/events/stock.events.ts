export const STOCK_LOW_EVENT = "inventory.stock.low";
export const STOCK_EXPIRED_EVENT = "inventory.stock.expired";

export type StockAlertEvent = {
  clinicId: string;
  medicineId: string;
  available: number;
  threshold: number;
  occurredAt: string;
};

