-- Free-plan hygiene: indexes for hot aggregates + reclaim blob storage.
CREATE INDEX IF NOT EXISTS "Receipt_purchasedAt_idx" ON "Receipt"("purchasedAt");
CREATE INDEX IF NOT EXISTS "ReceiptItem_receiptId_idx" ON "ReceiptItem"("receiptId");
CREATE INDEX IF NOT EXISTS "ReceiptItem_productId_idx" ON "ReceiptItem"("productId");

-- OCR runs client-side; base64 images must not live in the 500 MB free DB.
UPDATE "Receipt" SET "imageData" = NULL WHERE "imageData" IS NOT NULL;
