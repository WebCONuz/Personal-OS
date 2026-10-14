import {
  DatabaseIcon,
  DownloadIcon,
  FileWarningIcon,
  MonitorIcon,
  MoonIcon,
  ShieldAlertIcon,
  SunIcon,
  Trash2Icon,
  UploadIcon,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { confirm } from "@/components/shared/confirm";
import { LifeAreaIcon } from "@/components/shared/LifeArea";
import { SectionCard } from "@/components/shared/SectionCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { COLLECTION_LABELS, THEME_LABELS } from "@/constants/labels";
import { THEMES } from "@/data/schema/entities";
import { countDemoRecords } from "@/data/seed/demo";
import { useDbState, useLifeAreas, useMeta, useProfile } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import {
  ImportError,
  type ImportPreview,
  type ImportStrategy,
} from "@/services/backup";
import { formatDateTime } from "@/services/date";
import { CURRENCIES, type Currency } from "@/services/money";
import type { Theme } from "@/types";
import { settingsService } from "../service";

const THEME_ICONS: Record<Theme, LucideIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
};

function ProfileCard() {
  const profile = useProfile();
  const [name, setName] = useState(profile.displayName);
  const [hours, setHours] = useState(
    String(Math.round((profile.weeklyCapacityMinutes / 60) * 10) / 10),
  );
  const [buffer, setBuffer] = useState(String(profile.bufferPercent));
  const [error, setError] = useState<string | null>(null);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const h = Number(hours.replace(",", "."));
    const b = Number(buffer);
    if (!Number.isFinite(h) || h < 0 || h > 168)
      return setError("Haftalik soat 0–168 oralig‘ida bo‘lsin");
    if (!Number.isInteger(b) || b < 0 || b > 80)
      return setError("Buffer 0–80% oralig‘ida butun son bo‘lsin");
    setError(null);
    settingsService.updateProfile({
      displayName: name.trim().slice(0, 60),
      weeklyCapacityMinutes: Math.round(h * 60),
      bufferPercent: b,
    });
  };

  return (
    <SectionCard
      title="Profil va rejalash"
      description="Yangi haftalik rejalar uchun standart qiymatlar"
    >
      <form onSubmit={save} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="set-name">Ism</Label>
            <Input
              id="set-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="set-hours">Haftalik mavjud vaqt (soat)</Label>
            <Input
              id="set-hours"
              inputMode="decimal"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="set-buffer">Buffer (%)</Label>
            <Input
              id="set-buffer"
              type="number"
              min={0}
              max={80}
              value={buffer}
              onChange={(e) => setBuffer(e.target.value)}
            />
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="set-currency">Asosiy valyuta</Label>
            <NativeSelect
              id="set-currency"
              className="w-full"
              value={profile.defaultCurrency}
              onChange={(e) =>
                settingsService.updateProfile({
                  defaultCurrency: e.target.value as Currency,
                })
              }
            >
              {CURRENCIES.map((c) => (
                <NativeSelectOption key={c} value={c}>
                  {c}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium">
              Hafta boshlanishi va til
            </span>
            <p className="text-sm text-muted-foreground">
              Dushanba · O‘zbek (lotin). Boshqa tillar keyingi bosqichda.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3">
          <div>
            <p id="set-theme-label" className="text-sm font-medium">
              Mavzu
            </p>
            <p className="text-xs text-muted-foreground">
              “Tizim” qurilmangiz sozlamasiga avtomatik moslashadi.
            </p>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={0}
            value={profile.theme}
            onValueChange={(v) => v && settingsService.setTheme(v as Theme)}
            aria-labelledby="set-theme-label"
          >
            {THEMES.map((t) => {
              const Icon = THEME_ICONS[t];
              return (
                <ToggleGroupItem key={t} value={t}>
                  <Icon aria-hidden="true" /> {THEME_LABELS[t]}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
          <div>
            <Label htmlFor="set-gamification">
              Gamifikatsiya (XP, daraja, nishonlar)
            </Label>
            <p className="text-xs text-muted-foreground">
              O‘chirilsa ham tarix saqlanadi; faqat interfeysdan yashiriladi.
            </p>
          </div>
          <Switch
            id="set-gamification"
            checked={profile.gamificationEnabled}
            onCheckedChange={(c) =>
              settingsService.updateProfile(
                { gamificationEnabled: c },
                c ? "Gamifikatsiya yoqildi" : "Gamifikatsiya o‘chirildi",
              )
            }
          />
        </div>
        <Button type="submit" className="self-start">
          Saqlash
        </Button>
      </form>
    </SectionCard>
  );
}

function LifeAreasCard() {
  const areas = useLifeAreas();
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(
    null,
  );
  return (
    <SectionCard
      title="Hayot sohalari"
      description="Ishlatilmaydigan sohalarni yashirish mumkin; mavjud yozuvlar saqlanadi"
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {areas.map((a) => {
          const isEditing = editing?.id === a.id;
          return (
            <li
              key={a.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2",
                !a.isActive && "opacity-60",
              )}
            >
              <LifeAreaIcon
                name={a.icon}
                className="size-4 shrink-0 text-muted-foreground"
              />
              {isEditing ? (
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (settingsService.renameLifeArea(a.id, editing.name))
                      setEditing(null);
                  }}
                >
                  <Input
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ id: a.id, name: e.target.value })
                    }
                    aria-label="Soha nomi"
                    autoFocus
                    className="h-7"
                  />
                  <Button type="submit" size="sm">
                    OK
                  </Button>
                </form>
              ) : (
                <button
                  type="button"
                  className="flex-1 text-left text-sm hover:underline"
                  onClick={() => setEditing({ id: a.id, name: a.name })}
                  aria-label={`${a.name} nomini o‘zgartirish`}
                >
                  {a.name}
                </button>
              )}
              <Switch
                checked={a.isActive}
                onCheckedChange={(c) =>
                  settingsService.setLifeAreaActive(a.id, c)
                }
                aria-label={`${a.name} faol`}
              />
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

function ImportDialog({
  preview,
  onClose,
}: {
  preview: ImportPreview | null;
  onClose: () => void;
}) {
  const [strategy, setStrategy] = useState<ImportStrategy>("merge");
  if (!preview) return null;
  const apply = async () => {
    if (strategy === "replace") {
      const ok = await confirm({
        title: "Mavjud ma’lumotlar to‘liq almashtirilsinmi?",
        description:
          "Joriy barcha yozuvlar o‘chiriladi va fayldagilar bilan almashtiriladi. Avval joriy ma’lumotlarni eksport qilib olishni tavsiya qilamiz.",
        confirmLabel: "Almashtirish",
        destructive: true,
      });
      if (!ok) return;
    }
    if (settingsService.applyImport(preview, strategy)) onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importni tasdiqlash</DialogTitle>
          <DialogDescription>
            Fayl {formatDateTime(preview.exportedAt)} da yaratilgan (sxema v
            {preview.schemaVersion}). Jami {preview.totalIncoming} ta yozuv.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th scope="col" className="py-1.5 font-medium">
                  To‘plam
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  Fayldagi
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  Hozirgi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {preview.counts.map((c) => (
                <tr key={c.name}>
                  <td className="py-1.5">
                    {COLLECTION_LABELS[c.name] ?? c.name}
                  </td>
                  <td className="tabular py-1.5 text-right">{c.incoming}</td>
                  <td className="tabular py-1.5 text-right text-muted-foreground">
                    {c.existing}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.referenceFixes > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {preview.referenceFixes} ta mavjud bo‘lmagan bog‘lanish topildi —
              ular avtomatik uziladi.
            </p>
          )}
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Import usuli</legend>
          {(
            [
              [
                "merge",
                "Birlashtirish (tavsiya)",
                "Yangi yozuvlar qo‘shiladi; bir xil ID’li yozuvlardan yangilangani qoladi. Profil o‘zgarmaydi.",
              ],
              [
                "replace",
                "To‘liq almashtirish",
                "Joriy barcha ma’lumotlar fayldagilar bilan almashtiriladi.",
              ],
            ] as const
          ).map(([value, label, hint]) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2",
                strategy === value && "border-primary/50 bg-accent/40",
              )}
            >
              <input
                type="radio"
                name="import-strategy"
                value={value}
                checked={strategy === value}
                onChange={() => setStrategy(value)}
                className="mt-1 accent-primary"
              />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">
                  {hint}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => settingsService.exportBackup()}
          >
            <DownloadIcon /> Avval joriyni eksport
          </Button>
          <Button
            variant={strategy === "replace" ? "destructive" : "default"}
            onClick={apply}
          >
            Import qilish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DataCard() {
  const state = useDbState();
  const meta = useMeta();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [info, setInfo] = useState(() => settingsService.storageInfo());
  const demoCount = countDemoRecords(state);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportError(null);
    if (file.size > 20 * 1024 * 1024)
      return setImportError("Fayl juda katta (20 MB dan ortiq).");
    try {
      setPreview(settingsService.previewImport(await file.text()));
    } catch (error) {
      setImportError(
        error instanceof ImportError ? error.message : "Faylni o‘qib bo‘lmadi.",
      );
    }
  };

  const refresh = () => setInfo(settingsService.storageInfo());

  return (
    <SectionCard
      title="Ma’lumotlar va zaxira"
      description={
        meta.lastExportAt
          ? `Oxirgi eksport: ${formatDateTime(meta.lastExportAt)}`
          : "Hali eksport qilinmagan"
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => settingsService.exportBackup()}>
            <DownloadIcon /> JSON eksport
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <UploadIcon /> JSON import
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={onFile}
            aria-label="Zaxira faylini tanlash"
            tabIndex={-1}
          />
        </div>
        {importError && (
          <p
            className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <FileWarningIcon
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>
              {importError}{" "}
              <span className="text-muted-foreground">
                Mavjud ma’lumotlar o‘zgartirilmadi.
              </span>
            </span>
          </p>
        )}

        <div className="flex flex-col gap-2 rounded-lg border px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <DatabaseIcon
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />{" "}
            Demo ma’lumotlar
          </p>
          <p className="text-xs text-muted-foreground">
            {demoCount > 0
              ? `${demoCount} ta demo yozuv bor. Ular faqat namuna — o‘zingizning yozuvlaringizga ta’sir qilmasdan o‘chiriladi.`
              : "Demo yozuvlar yuklanmagan."}
          </p>
          <div className="flex flex-wrap gap-2">
            {demoCount > 0 ? (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (
                    await confirm({
                      title: "Demo ma’lumotlar o‘chirilsinmi?",
                      description:
                        "Faqat demo yozuvlar o‘chiriladi. Ularga bog‘langan o‘z yozuvlaringiz saqlanib, bog‘lanish uziladi.",
                      confirmLabel: "O‘chirish",
                      destructive: true,
                    })
                  ) {
                    settingsService.clearDemo();
                    refresh();
                  }
                }}
              >
                Demoni tozalash
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => settingsService.loadDemo() && refresh()}
              >
                Demo yuklash
              </Button>
            )}
          </div>
        </div>

        <div
          id="recovery"
          className="flex flex-col gap-2 rounded-lg border px-4 py-3"
        >
          <p className="text-sm font-medium">Brauzer xotirasi</p>
          <p className="tabular text-xs text-muted-foreground">
            Taxminan {(info.usageBytes / 1024).toFixed(1)} KB ishlatilmoqda
            (brauzer limiti odatda ~5 MB).
          </p>
          {info.recoveryKeys.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground">
                Buzilgan yoki migratsiyadan oldingi ma’lumotlarning zaxira
                nusxalari:
              </p>
              <ul className="flex flex-col gap-1">
                {info.recoveryKeys.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-xs">
                    <span className="flex-1 truncate font-mono">{key}</span>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => settingsService.downloadRecovery(key)}
                    >
                      Yuklab olish
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Zaxira nusxani o‘chirish"
                      onClick={async () => {
                        if (
                          await confirm({
                            title: "Zaxira nusxa o‘chirilsinmi?",
                            confirmLabel: "O‘chirish",
                            destructive: true,
                          })
                        ) {
                          settingsService.deleteRecovery(key);
                          refresh();
                        }
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 px-4 py-3">
          <p className="text-sm font-medium text-destructive">
            Barcha ma’lumotlarni o‘chirish
          </p>
          <p className="text-xs text-muted-foreground">
            Shu brauzerdagi barcha Personal OS ma’lumotlari o‘chiriladi.
            Qaytarib bo‘lmaydi.
          </p>
          <Button
            size="sm"
            variant="destructive"
            className="self-start"
            onClick={async () => {
              if (
                await confirm({
                  title: "Barcha ma’lumotlar o‘chirilsinmi?",
                  description:
                    "Maqsadlar, vazifalar, moliya va boshqa barcha yozuvlar o‘chiriladi. Davom etishdan oldin JSON eksport qilib oling.",
                  confirmLabel: "Hammasini o‘chirish",
                  destructive: true,
                })
              ) {
                settingsService.resetAll();
              }
            }}
          >
            <Trash2Icon /> Hammasini o‘chirish
          </Button>
        </div>
      </div>
      <ImportDialog preview={preview} onClose={() => setPreview(null)} />
    </SectionCard>
  );
}

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Sozlamalar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profil, hayot sohalari, zaxira nusxa va maxfiylik.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <ProfileCard />
          <LifeAreasCard />
        </div>
        <div className="flex flex-col gap-6">
          <DataCard />
          <SectionCard
            title={
              <span className="inline-flex items-center gap-2">
                <ShieldAlertIcon className="size-4" aria-hidden="true" />{" "}
                Maxfiylik
              </span>
            }
          >
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
              <li>
                Barcha ma’lumotlar faqat shu brauzerning localStorage xotirasida
                saqlanadi. Hech qanday serverga yuborilmaydi.
              </li>
              <li>
                Ilovani hostingga joylash ma’lumotlarni qurilmalar o‘rtasida
                sinxronlamaydi: har bir brauzer va qurilmada alohida ma’lumot
                bo‘ladi.
              </li>
              <li>
                localStorage shifrlanmagan: kompyuterga kirish huquqi bor odam
                yoki brauzer kengaytmalari uni o‘qishi mumkin. Parol, bank karta
                rekvizitlari va boshqa juda sezgir ma’lumotlarni kiritmang.
              </li>
              <li>
                Moliya bo‘limi faqat shaxsiy hisob-kitob uchun: bank
                integratsiyasi, to‘lov yoki investitsiya maslahati yo‘q.
              </li>
              <li>
                Brauzer ma’lumotlarini tozalash barcha yozuvlarni o‘chiradi —
                muntazam JSON eksport qilib turing.
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
