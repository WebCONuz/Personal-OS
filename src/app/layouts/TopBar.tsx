import {
  BookOpenIcon,
  CheckIcon,
  ListTodoIcon,
  Loader2Icon,
  MenuIcon,
  MoonIcon,
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  TargetIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/shared/Kbd";
import { useTransactionEditor } from "@/features/finance/editor";
import { useGoalEditor } from "@/features/goals/editor";
import { useNoteEditor } from "@/features/knowledge/editor";
import { useTaskEditor } from "@/features/tasks/editor";
import { TimerIndicator } from "@/features/time-tracking/components/TimerIndicator";
import { useDb } from "@/data/store";
import { settingsService } from "@/features/settings/service";
import { useToday } from "@/hooks/useData";
import { useResolvedTheme } from "@/hooks/useTheme";
import { formatDate, formatWeekRange, startOfWeekKey } from "@/services/date";
import { pageTitleFor } from "../config/navigation";
import { useSearchOpen } from "./CommandSearch";

/** Quick light/dark switch; picking "system" stays available in Settings. */
function ThemeToggle() {
  const resolved = useResolvedTheme();
  const isDark = resolved === "dark";
  const label = isDark ? "Yorug‘ rejimga o‘tish" : "Qorong‘i rejimga o‘tish";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => settingsService.setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}

function SaveIndicator() {
  const persistent = useDb((s) => s.persistent);
  const blocked = useDb((s) => s.writeBlocked);
  const saving = useDb((s) => s.pendingWrites > 0);
  if (!persistent || blocked) {
    return (
      <Link
        to="/settings"
        className="hidden items-center gap-1 text-xs text-warning-foreground sm:flex"
        title="Ma’lumotlar saqlanmayapti"
      >
        <TriangleAlertIcon className="size-3.5" aria-hidden="true" />{" "}
        Saqlanmayapti
      </Link>
    );
  }
  return (
    <span
      className="hidden items-center gap-1 text-xs text-muted-foreground xl:flex"
      title="Ma’lumotlar shu brauzerda saqlanadi"
    >
      {saving ? (
        <>
          <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />{" "}
          Saqlanmoqda…
        </>
      ) : (
        <>
          <CheckIcon className="size-3.5" aria-hidden="true" /> Lokal saqlangan
        </>
      )}
    </span>
  );
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  const today = useToday();
  const setSearch = useSearchOpen((s) => s.setOpen);
  const openTask = useTaskEditor((s) => s.openCreate);
  const openGoal = useGoalEditor((s) => s.openCreate);
  const openNote = useNoteEditor((s) => s.openCreate);
  const openTx = useTransactionEditor((s) => s.openCreate);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur supports-backdrop-filter:bg-background/75 sm:gap-3 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenu}
        aria-label="Menyuni ochish"
      >
        <MenuIcon />
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {pageTitleFor(pathname)}
        </p>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          <span className="first-letter:uppercase">
            {formatDate(today, "EEEE, d MMMM")}
          </span>{" "}
          · Hafta: {formatWeekRange(startOfWeekKey(today))}
        </p>
      </div>
      <SaveIndicator />
      <TimerIndicator />
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSearch(true)}
        className="hidden gap-2 text-muted-foreground md:inline-flex"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <SearchIcon /> Qidirish <Kbd>Ctrl K</Kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSearch(true)}
        className="md:hidden"
        aria-label="Qidiruv"
      >
        <SearchIcon />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" aria-label="Tezkor qo‘shish">
            <PlusIcon /> <span className="hidden sm:inline">Qo‘shish</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Tezkor qo‘shish</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => openTask()}>
            <ListTodoIcon /> Vazifa
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openGoal()}>
            <TargetIcon /> Maqsad
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openNote()}>
            <BookOpenIcon /> Qayd
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openTx({ type: "expense" })}>
            <ReceiptIcon /> Xarajat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ThemeToggle />
      <Button
        asChild
        variant="ghost"
        size="icon"
        aria-label="Sozlamalar"
        className="hidden sm:inline-flex"
      >
        <Link to="/settings">
          <SettingsIcon />
        </Link>
      </Button>
    </header>
  );
}
