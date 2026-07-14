"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CatalogueRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm text-muted-foreground">
        Catalogue is no longer available. Redirecting...
      </p>
    </div>
  );
}
