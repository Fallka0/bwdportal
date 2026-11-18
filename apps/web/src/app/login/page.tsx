import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { demoAccounts } from "@bwd/db";
import { config } from "@bwd/shared";
import { currentUserId } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { LoginView } from "./LoginView";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ fehler?: string }> }) {
  const env = await serverEnv();
  if (await currentUserId(env)) redirect("/");
  const accounts = env.authMode === "mock" ? await demoAccounts(env.db) : [];
  const { fehler } = await searchParams;
  return <LoginView mock={env.authMode === "mock"} accounts={accounts} emailPattern={config.school.emailPattern} initialError={fehler === "konto"} />;
}
