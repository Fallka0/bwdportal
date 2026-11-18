import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export const metadata: Metadata = { title: "Profil" };

export default async function Profile() {
  const { me } = await requireUser();
  return (
    <>
      <div className="ph">
        <h1>Profil</h1>
      </div>
      <p>
        {me.name} · {me.classCode} · {me.email}
      </p>
      <LogoutButton />
    </>
  );
}
