import { TriangleAlertIcon } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "@/components/ui/button";
import { backupFileName, createBackup, downloadJson } from "@/services/backup";
import { getDb } from "@/data/store";

/** Last-resort error screen: explains the problem and lets the user save their data. */
export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Noma’lum xatolik";
  if (import.meta.env.DEV) console.error(error);
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <TriangleAlertIcon
          className="mx-auto mb-4 size-10 text-warning"
          aria-hidden="true"
        />
        <h1 className="text-xl font-semibold">Kutilmagan xatolik yuz berdi</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sahifani yangilab ko‘ring. Ma’lumotlaringiz brauzerda saqlangan;
          ehtiyot uchun zaxira nusxani yuklab olishingiz mumkin.
        </p>
        <p className="mt-3 rounded-md bg-muted px-3 py-2 font-mono text-xs wrap-break-word text-muted-foreground">
          {message}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => window.location.assign("/")}>
            Bosh sahifa
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              downloadJson(backupFileName(), createBackup(getDb()))
            }
          >
            Zaxira yuklab olish
          </Button>
        </div>
      </div>
    </main>
  );
}
