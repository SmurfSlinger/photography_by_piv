"use server";

import { revalidatePath } from "next/cache";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isClientId, parseClientInput } from "@/lib/client-admin";
import { prisma } from "@/lib/prisma";

export type ClientAdminActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type CreateClientResult =
  | { ok: true; clientId: string }
  | { ok: false; error: string };

function revalidateClientPaths(clientId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/galleries");
  revalidatePath("/admin/galleries/new");
  if (clientId) {
    revalidatePath(`/admin/clients/${clientId}`);
  }
}

export async function createClient(input: {
  name: string;
  email?: string | null;
}): Promise<CreateClientResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = parseClientInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  try {
    const client = await prisma.client.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
      },
      select: { id: true },
    });
    revalidateClientPaths(client.id);
    return { ok: true, clientId: client.id };
  } catch (error) {
    console.error("createClient failed", error);
    return { ok: false, error: "Unable to create client. Try again." };
  }
}

export async function updateClient(
  clientId: string,
  input: { name: string; email?: string | null }
): Promise<ClientAdminActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!isClientId(clientId)) {
    return { ok: false, error: "Invalid client" };
  }

  const parsed = parseClientInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  const existing = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!existing) {
    return { ok: false, error: "Client not found" };
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
    },
  });
  revalidateClientPaths(clientId);
  return { ok: true };
}
