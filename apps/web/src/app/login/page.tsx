import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { demoAccounts } from "@bwd/db";
import { config } from "@bwd/shared";
import { currentUserId, microsoftAllowed, mockAllowed } from "@/lib/auth";
import { msConfigured } from "@/lib/auth/microsoft";
import { serverEnv } from "@/lib/env";
import { LoginView } from "./LoginView";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ fehler?: string }> }) {
  const env = await serverEnv();
  if (await currentUserId(env)) redirect("/");
  const mock = mockAllowed(env);
  const accounts = mock ? await demoAccounts(env.db) : [];
  const { fehler } = await searchParams;
  return (
    <LoginView
      mock={mock}
      microsoft={microsoftAllowed(env) && msConfigured(env.ms)}
      accounts={accounts}
      emailPattern={config.school.emailPattern}
      initialError={fehler === "konto" ? "konto" : fehler === "microsoft" ? "microsoft" : null}
    />
  );
}
