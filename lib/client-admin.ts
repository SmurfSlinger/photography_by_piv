export type CreateClientInput = {
  name: string;
  email: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isClientId(value: string): boolean {
  return UUID_RE.test(value);
}

export function parseClientInput(input: {
  name?: string;
  email?: string | null;
}): { ok: true; data: CreateClientInput } | { ok: false; error: string } {
  const name = input.name?.trim() ?? "";
  const emailRaw = input.email?.trim() ?? "";

  if (name.length < 1 || name.length > 120) {
    return { ok: false, error: "Name is required (120 characters or fewer)." };
  }

  if (emailRaw.length > 0) {
    if (emailRaw.length > 120 || !EMAIL_RE.test(emailRaw)) {
      return { ok: false, error: "Enter a valid email, or leave it blank." };
    }
  }

  return {
    ok: true,
    data: {
      name,
      email: emailRaw.length > 0 ? emailRaw : null,
    },
  };
}

export function clientOptionLabel(client: {
  name: string;
  email: string | null;
}): string {
  return client.email ? `${client.name} (${client.email})` : client.name;
}
