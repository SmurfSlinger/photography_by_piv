-- Add optional detail when "other" contact method is selected.

ALTER TABLE "booking_inquiries" ADD COLUMN "contact_other" TEXT;
