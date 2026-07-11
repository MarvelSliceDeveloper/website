import crypto from "crypto";
import { prisma } from "../../utils/prisma";

const KEY_PREFIX = "sk_lms_";

function generateApiKey(): string {
  const raw = crypto.randomBytes(32).toString("hex");
  return `${KEY_PREFIX}${raw}`;
}

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export const apiKeyService = {
  async create(
    name: string,
    description: string | undefined,
    createdBy: string,
  ) {
    const plaintext = generateApiKey();
    const hashed = hashApiKey(plaintext);

    const apiKey = await prisma.apiKey.create({
      data: {
        key: hashed,
        name,
        description,
        createdBy,
      },
    });

    return { id: apiKey.id, name: apiKey.name, key: plaintext };
  },

  async list() {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
    });

    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      description: k.description,
      key: maskKey(k.key),
      active: k.active,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    }));
  },

  async revoke(id: string) {
    await prisma.apiKey.update({
      where: { id },
      data: { active: false },
    });
  },
};

function maskKey(hashed: string): string {
  if (hashed.length <= 8) return "sk_****";
  return `sk_${hashed.slice(0, 4)}...${hashed.slice(-4)}`;
}
