import { prisma } from "../../utils/prisma";
import { decryptToken, encryptToken } from "../../utils/encryption";

const TOKEN_URL = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;

export async function getTokenForUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { msAccessToken: true, msRefreshToken: true },
  });

  if (!user || !user.msAccessToken || !user.msRefreshToken) {
    throw new Error(
      `Microsoft account not linked for this user. Please go to Admin → Microsoft Settings and link your account.`,
    );
  }

  try {
    return decryptToken(user.msAccessToken);
  } catch (err: any) {
    console.error(
      `[GraphAuth] Failed to decrypt access token for user ${userId}:`,
      err.message,
    );
    throw new Error(
      `Your Microsoft account tokens are corrupted or the encryption key has changed. Please re-link your account in Admin → Microsoft Settings.`,
    );
  }
}

export async function refreshMsTokenForUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { msRefreshToken: true },
  });

  if (!user || !user.msRefreshToken) {
    throw new Error(`User not found or no refresh token: ${userId}`);
  }

  const refreshToken = decryptToken(user.msRefreshToken);

  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  const redirectUri = process.env.MS_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Microsoft OAuth environment variables are not properly configured",
    );
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope:
        "openid profile email offline_access Calendars.ReadWrite OnlineMeetings.ReadWrite User.Read OnlineMeetingRecording.Read.All",
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("[GraphAuth] Failed to refresh Microsoft token:", errorData);
    const parsed = JSON.parse(errorData);
    // Refresh token expired or revoked — user needs to re-link
    if (parsed?.error === "invalid_grant") {
      throw new Error(
        "Your Microsoft account session has expired. Please re-link your account in Admin → Microsoft Settings.",
      );
    }
    throw new Error(
      `Failed to refresh Microsoft token: ${parsed?.error_description || response.statusText}`,
    );
  }

  const data = await response.json();

  if (!data.access_token || !data.refresh_token) {
    throw new Error("Invalid token response from Microsoft");
  }

  // Save new tokens to DB
  await prisma.user.update({
    where: { id: userId },
    data: {
      msAccessToken: encryptToken(data.access_token),
      msRefreshToken: encryptToken(data.refresh_token),
    },
  });

  return data.access_token;
}

export async function getAppToken(): Promise<string> {
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  const tenantId = process.env.MS_TENANT_ID || "common";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Microsoft OAuth environment variables are not properly configured",
    );
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "https://graph.microsoft.com/.default",
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Failed to get app token:", errorData);
    throw new Error(`Failed to get app token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}
