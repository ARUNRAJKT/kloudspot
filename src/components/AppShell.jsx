import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import { Calendar, ChevronDown, LogOut, MapPin, Menu } from "lucide-react";
import crowdIcon from "@/assets/overview/crowd.svg";
import menuBg from "@/assets/overview/menu.svg";
import menuIcon from "@/assets/overview/menuicon.svg";
import overviewIcon from "@/assets/overview/overview.svg";
import AlertsPanel from "@/components/AlertsPanel";
import LanguageMenu from "@/components/LanguageMenu";
import { getSession } from "@/lib/api";
import { siteCalendarDate } from "@/lib/time";
import { useSite } from "@/context/SiteContext";

function initials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "KS";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const navItems = [
  { to: "/overview", labelKey: "nav.overview", icon: overviewIcon },
  { to: "/entries", labelKey: "nav.entries", icon: crowdIcon },
];

function SideNav({ onNavigate, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useSite();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-5">
        <img src={menuIcon} alt="kloudspot" className="h-10 w-[127px]" />
        <button
          type="button"
          className="text-white"
          aria-label={t("nav.closeMenu")}
          onClick={onClose}
        >
          <Menu className="size-5" />
        </button>
      </div>
      <nav className="flex flex-col items-center gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `relative flex h-[50px] w-[216px] rotate-0 items-center gap-4 rounded-[4px] px-4 py-2 font-plex text-[16px] leading-[14.63px] font-normal tracking-[-0.27px] text-white capitalize opacity-100 ${
                isActive ? "bg-[#FFFFFF4D]" : "hover:bg-white/10"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 left-0 h-[34px] w-[6px] -translate-y-1/2 rounded-full bg-white"
                  />
                ) : null}
                <img src={item.icon} alt="" className="size-5 shrink-0" />
                {t(item.labelKey)}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-auto flex items-center gap-3 px-6 py-5 text-sm text-white/90 hover:text-white"
      >
        <LogOut className="size-4" />
        {t("nav.logout")}
      </button>
    </div>
  );
}

function SiteMenu() {
  const { t } = useTranslation();
  const { sites, site, setSiteId, sitesError } = useSite();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-800"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MapPin className="size-4 text-neutral-500" />
        <span className="max-w-40 truncate sm:max-w-56">
          {site?.name || t("nav.selectSite")}
        </span>
        <ChevronDown className="size-4 text-neutral-500" />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute top-11 left-0 z-20 max-h-72 w-72 overflow-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {sitesError ? (
            <li className="px-3 py-2 text-sm text-red-600">{t(sitesError)}</li>
          ) : null}
          {sites.map((item) => (
            <li key={item.siteId}>
              <button
                type="button"
                role="option"
                aria-selected={item.siteId === site?.siteId}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100"
                onClick={() => {
                  setSiteId(item.siteId);
                  setOpen(false);
                }}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MenuPanel({ onNavigate, onClose }) {
  return (
    <aside className="relative h-svh w-[240px] shrink-0 overflow-hidden bg-[#0A5D5C]">
      <img
        src={menuBg}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="relative h-full">
        <SideNav onNavigate={onNavigate} onClose={onClose} />
      </div>
    </aside>
  );
}

export default function AppShell({ children }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches,
  );
  const session = getSession();

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="flex min-h-svh bg-[#f4f6f8] text-neutral-900">
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-out md:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-label={t("nav.closeMenu")}
        tabIndex={menuOpen ? 0 : -1}
        onClick={closeMenu}
      />
      <div
        className={`sticky top-0 z-50 h-svh shrink-0 overflow-hidden transition-[width] duration-300 ease-out motion-reduce:transition-none max-md:fixed max-md:inset-y-0 max-md:left-0 ${
          menuOpen ? "w-[240px]" : "w-0"
        }`}
        inert={!menuOpen}
      >
        <MenuPanel
          onClose={closeMenu}
          onNavigate={() => {
            if (window.matchMedia("(max-width: 767px)").matches) closeMenu();
          }}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            className={`rounded-md p-1 text-neutral-700 ${menuOpen ? "md:hidden" : ""}`}
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Menu className="size-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="hidden text-sm font-medium text-neutral-800 sm:inline">
              {t("nav.solutions")}
            </span>
            <span className="hidden h-5 w-px bg-neutral-200 sm:block" />
            <SiteMenu />
          </div>
          <div className="flex items-center gap-2">
            <LanguageMenu />
            <AlertsPanel />
            <span
              className="grid size-8 place-items-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700"
              title={session?.name || t("nav.account")}
            >
              {initials(session?.name)}
            </span>
          </div>
        </header>
        <div className="flex-1 px-4 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

function formatDateLabel(dateKey, language) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat(language, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function TodayButton() {
  const { t, i18n } = useTranslation();
  const { site, selectedDate, setSelectedDate } = useSite();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const todayKey = siteCalendarDate(site?.timezone || "UTC");
  const value =
    selectedDate && selectedDate <= todayKey ? selectedDate : todayKey;
  const isToday = value === todayKey;

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function choose(next) {
    setSelectedDate(!next || next === todayKey ? "" : next);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-800 shadow-none"
        aria-expanded={open}
        aria-label={t("nav.chooseDate")}
        onClick={() => setOpen((current) => !current)}
      >
        <Calendar className="size-4" />
        {isToday ? t("nav.today") : formatDateLabel(value, i18n.language)}
      </button>
      {open ? (
        <div className="absolute top-11 right-0 z-20 w-56 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
          <label
            className="block text-xs font-medium text-neutral-500"
            htmlFor="crowd-date"
          >
            {t("nav.chooseDate")}
          </label>
          <input
            id="crowd-date"
            type="date"
            max={todayKey}
            value={value}
            className="mt-2 w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
            onChange={(event) => choose(event.target.value)}
          />
          <button
            type="button"
            className="mt-2 text-sm font-medium text-teal-700"
            onClick={() => {
              choose("");
              setOpen(false);
            }}
          >
            {t("nav.today")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
