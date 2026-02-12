import { redirect } from "next/navigation";
import {
  findReminderByToken,
  isTokenExpired,
  setReminderReturnedAt,
} from "@tax/adapters";
import { ReturnClient } from "./ReturnClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ReturnPage({ params }: PageProps) {
  const { token } = await params;

  const reminder = await findReminderByToken(token);

  if (!reminder || isTokenExpired(reminder.createdAt)) {
    redirect("/precheck");
  }

  // Mark as returned (fire-and-forget — don't block render)
  setReminderReturnedAt(reminder.id).catch(() => {});

  return (
    <ReturnClient
      wizardState={reminder.wizardState}
      softResult={reminder.softResult}
    />
  );
}
