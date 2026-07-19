"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HealthRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/health");
  }, [router]);
  return null;
}
