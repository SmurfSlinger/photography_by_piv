-- CreateEnum
CREATE TYPE "InquiryStatus_new" AS ENUM ('new', 'contacted', 'scheduled', 'converted_to_booking', 'canceled', 'archived');

-- AlterTable
ALTER TABLE "booking_inquiries" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "booking_inquiries" ALTER COLUMN "status" TYPE "InquiryStatus_new" USING (
  CASE "status"::text
    WHEN 'booked' THEN 'converted_to_booking'::"InquiryStatus_new"
    WHEN 'closed' THEN 'canceled'::"InquiryStatus_new"
    ELSE "status"::text::"InquiryStatus_new"
  END
);
ALTER TABLE "booking_inquiries" ALTER COLUMN "status" SET DEFAULT 'new';

-- DropEnum
DROP TYPE "InquiryStatus";

-- RenameEnum
ALTER TYPE "InquiryStatus_new" RENAME TO "InquiryStatus";

-- AlterTable
ALTER TABLE "booking_inquiries" ADD COLUMN "admin_notes" TEXT;
ALTER TABLE "booking_inquiries" ADD COLUMN "contacted_at" TIMESTAMP(3);
ALTER TABLE "booking_inquiries" ADD COLUMN "archived_at" TIMESTAMP(3);
