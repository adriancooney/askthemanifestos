"use client";

import { SWRConfig, SWRConfiguration } from "swr";

export function SWRProvider({
  value,
  children,
}: {
  value: SWRConfiguration;
  children: React.ReactNode;
}) {
  return <SWRConfig value={value}>{children}</SWRConfig>;
}
