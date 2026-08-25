import dns from "node:dns/promises";
import { AppError } from "./errors";

function isPrivateIpv4(a: number, b: number, c: number, d: number): boolean {
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIp(ip: string): boolean {
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    return isPrivateIpv4(
      Number(v4[1]),
      Number(v4[2]),
      Number(v4[3]),
      Number(v4[4]),
    );
  }
  const normalized = ip.toLowerCase().replace(/%[a-z0-9]+$/i, "");
  if (normalized === "::1" || normalized === "::") return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) {
    const parts = mapped[1].split(".").map(Number);
    return isPrivateIpv4(parts[0], parts[1], parts[2], parts[3]);
  }
  const first = normalized.split(":")[0] || "0";
  const val = parseInt(first, 16);
  if (Number.isNaN(val)) return false;
  if ((val & 0xfe00) === 0xfc00) return true;
  if ((val & 0xffc0) === 0xfe80) return true;
  return false;
}

async function assertPublicHostname(hostname: string): Promise<void> {
  const records: string[] = [];
  try {
    records.push(...(await dns.resolve4(hostname)));
  } catch {
    /* no A records */
  }
  try {
    records.push(...(await dns.resolve6(hostname)));
  } catch {
    /* no AAAA records */
  }
  if (records.length === 0) {
    throw new AppError(400, "Could not resolve host");
  }
  if (records.some(isPrivateIp)) {
    throw new AppError(
      400,
      "This URL points to a private or reserved address and cannot be fetched",
    );
  }
}

export async function ssrfSafeFetch(
  inputUrl: string,
  init: RequestInit = {},
  maxRedirects = 5,
): Promise<Response> {
  let current: URL;
  try {
    current = new URL(inputUrl);
  } catch {
    throw new AppError(400, "Invalid url");
  }
  if (!/^https?:$/.test(current.protocol)) {
    throw new AppError(400, "Only http(s) URLs are allowed");
  }
  if (current.username || current.password) {
    throw new AppError(400, "URL must not include credentials");
  }

  for (let i = 0; i <= maxRedirects; i++) {
    await assertPublicHostname(current.hostname);
    const res = await fetch(current, { ...init, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      res.body?.cancel();
      if (!location) {
        throw new AppError(
          400,
          "Redirect response is missing a Location header",
        );
      }
      try {
        current = new URL(location, current);
      } catch {
        throw new AppError(400, "Invalid redirect target");
      }
      continue;
    }
    return res;
  }
  throw new AppError(400, "Too many redirects");
}
