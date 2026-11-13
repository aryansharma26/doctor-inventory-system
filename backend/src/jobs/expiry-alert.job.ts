import { withPlatform } from "../config/database-context.js";
import { logger } from "../config/logger.js";

export async function collectExpiryAlerts(daysAhead = 30) {
  const cutoff = new Date(Date.now() + daysAhead * 86_400_000);
  const lots = await withPlatform((tx) => tx.inventoryLot.findMany({
    where: { quantity: { gt: 0 }, expiryDate: { lte: cutoff } },
    select: { id: true, clinicId: true, medicineId: true, expiryDate: true, quantity: true }
  }));
  logger.info({ count: lots.length, daysAhead }, "expiry alert scan complete");
  return lots;
}
