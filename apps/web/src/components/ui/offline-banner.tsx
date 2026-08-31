"use client";

import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="border-b border-warning/40 bg-warning/10 px-4 py-2 text-center text-sm text-navy dark:text-white"
      role="status"
    >
      You&apos;re offline. You can finish this session — your answers will save when you reconnect.
    </div>
  );
}
