import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { isAdminAuthConfigured, isAdminAuthenticated } from "@/lib/admin-auth";

type PageProps = {
  searchParams: Promise<{ from?: string }>;
};

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const redirectTo =
    params.from?.startsWith("/admin") && !params.from.includes("//")
      ? params.from
      : "/admin";

  if (await isAdminAuthenticated()) {
    redirect(redirectTo);
  }

  const configured = isAdminAuthConfigured();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="eyebrow">Private admin</p>
      <h1 className="section-title mt-3">Sign in</h1>
      <p className="mt-4 text-sm leading-relaxed text-stone-600">
        Booking inquiries only. Not indexed by search engines.
      </p>

      {!configured ? (
        <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Admin access is not configured. Set{" "}
          <code className="font-mono text-xs">ADMIN_ACCESS_TOKEN</code> or{" "}
          <code className="font-mono text-xs">ADMIN_PASSWORD</code> and{" "}
          <code className="font-mono text-xs">SESSION_SECRET</code> in the server{" "}
          <code className="font-mono text-xs">.env</code> (see{" "}
          <code className="font-mono text-xs">.env.example</code>).
        </p>
      ) : (
        <AdminLoginForm redirectTo={redirectTo} />
      )}

      <p className="mt-10 text-center text-sm text-stone-500">
        <Link href="/" className="underline-offset-2 hover:underline">
          Back to site
        </Link>
      </p>
    </main>
  );
}
