-- AlterTable
ALTER TABLE "clients" ADD COLUMN "scheduled_end_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "booking_inquiries" ADD COLUMN "scheduled_end_at" TIMESTAMP(3);
