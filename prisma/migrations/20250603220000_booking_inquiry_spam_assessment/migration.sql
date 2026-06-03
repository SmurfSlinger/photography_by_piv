-- Persist spam/scam assessment at booking submission time.
ALTER TABLE "booking_inquiries" ADD COLUMN "spam_score" INTEGER,
ADD COLUMN "spam_reasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "spam_flagged" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "booking_inquiries_spam_flagged_idx" ON "booking_inquiries"("spam_flagged");
