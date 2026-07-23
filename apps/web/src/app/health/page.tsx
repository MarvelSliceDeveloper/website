"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/lib/use-page-title";

export default function HealthRedirect() {
  usePageTitle("Health Check");
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/health");
  }, [router]);
  return null;
}
