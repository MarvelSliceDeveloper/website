"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useRegisteredEmailCheck(email: string, enabled = true) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const trimmed = email.trim();
    if (!enabled || !trimmed || !trimmed.includes("@")) {
      setIsRegistered(false);
      return;
    }

    const handle = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await api.get<{ exists: boolean }>(
          "/api/payments/check-email",
          { email: trimmed },
        );
        setIsRegistered(!!result.exists);
      } catch {
        setIsRegistered(false);
      } finally {
        setChecking(false);
      }
    }, 450);

    return () => clearTimeout(handle);
  }, [email, enabled]);

  return { isRegistered, checking };
}
