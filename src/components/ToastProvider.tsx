"use client";

import type { ReactNode } from "react";
import { ToastProvider as Provider } from "@/components/Toast";

export function AppToastProvider({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>;
}
