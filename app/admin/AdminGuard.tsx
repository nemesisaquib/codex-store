"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AdminGuard() {
  const pathname = usePathname();

  useEffect(() => {
    // Only run this logic on the client inside the admin area, but exclude the login page
    if (!pathname?.startsWith("/admin") || pathname === "/admin/login") {
      return;
    }

    const handleBeforeUnload = () => {
      // Send a synchronous-like request to destroy the session cookie on the server.
      // We use keepalive: true so the request completes even if the browser closes immediately.
      fetch("/api/auth/admin", {
        method: "DELETE",
        keepalive: true,
      }).catch(() => {
        // Fallback: forcefully delete the cookie on the client-side as well
        document.cookie = "admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleBeforeUnload);
    };
  }, [pathname]);

  return null;
}
