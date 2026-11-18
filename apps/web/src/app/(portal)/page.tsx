import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { greeting } from "@bwd/shared";

export const metadata: Metadata = { title: "Übersicht" };

export default async function Home() {
  const { me, env } = await requireUser();
  return (
    <div className="ph">
      <h1>
        {greeting(env.now.time)}, {me.firstName}.
      </h1>
    </div>
  );
}
