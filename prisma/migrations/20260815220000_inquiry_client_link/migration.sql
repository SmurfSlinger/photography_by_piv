-- AlterTable
ALTER TABLE "booking_inquiries" ADD COLUMN "client_id" TEXT;

-- CreateIndex
CREATE INDEX "booking_inquiries_client_id_idx" ON "booking_inquiries"("client_id");

-- AddForeignKey
ALTER TABLE "booking_inquiries" ADD CONSTRAINT "booking_inquiries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
