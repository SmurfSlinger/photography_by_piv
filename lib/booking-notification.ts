/**
 * Server-only booking notification recipient.
 * Never use NEXT_PUBLIC_ or import this from client components.
 */
export function getBookingNotificationEmail(): string | null {
  const email = process.env.BOOKING_NOTIFICATION_EMAIL?.trim();
  if (!email) return null;
  return email;
}
