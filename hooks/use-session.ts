"use client";

import { useEffect, useState } from "react";
import { readSession } from "@/lib/utils";
import type { Session } from "@/lib/types";

// localStorage 기반 세션을 SSR/CSR 하이드레이션 불일치 없이 읽기 위한 훅
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setLoaded(true);
  }, []);

  return { session, loaded };
}
