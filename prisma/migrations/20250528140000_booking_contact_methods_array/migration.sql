-- Replace single preferred contact method with multiple contact methods.

ALTER TABLE "booking_inquiries" ADD COLUMN "contact_methods" TEXT[];

UPDATE "booking_inquiries"
SET "contact_methods" = ARRAY["preferred_contact_method"::text]
WHERE "preferred_contact_method" IS NOT NULL;

ALTER TABLE "booking_inquiries" DROP COLUMN "preferred_contact_method";

DROP TYPE "PreferredContactMethod";

ALTER TABLE "booking_inquiries" ALTER COLUMN "contact_methods" SET NOT NULL;
ALTER TABLE "booking_inquiries" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "booking_inquiries" ALTER COLUMN "phone" DROP NOT NULL;
