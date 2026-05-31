-- CreateEnum
CREATE TYPE "PreferredContactMethod" AS ENUM ('email', 'phone', 'text', 'instagram');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('wedding', 'couples', 'family', 'portrait', 'other');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('new', 'contacted', 'booked', 'closed');

-- CreateTable
CREATE TABLE "booking_inquiries" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "instagram_handle" TEXT,
    "preferred_contact_method" "PreferredContactMethod" NOT NULL,
    "session_type" "SessionType" NOT NULL,
    "session_type_other" TEXT,
    "package_interest" TEXT NOT NULL,
    "preferred_date" DATE,
    "backup_date" DATE,
    "location_idea" TEXT,
    "vibe_style" TEXT,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'new',
    "scheduled_at" TIMESTAMP(3),
    "external_calendar_id" TEXT,

    CONSTRAINT "booking_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_inquiries_created_at_idx" ON "booking_inquiries"("created_at");

-- CreateIndex
CREATE INDEX "booking_inquiries_status_idx" ON "booking_inquiries"("status");
