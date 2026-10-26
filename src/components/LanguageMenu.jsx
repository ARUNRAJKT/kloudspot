import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", short: "En" },
  { code: "hi", short: "हि" },
];

export default function LanguageMenu() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const active =
    languages.find((language) =>
      i18n.resolvedLanguage?.startsWith(language.code),
    ) || languages[0];

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
        className="grid size-8 place-items-center rounded-full bg-[#009490] text-xs font-medium text-white"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("nav.language")}
        onClick={() => setOpen((current) => !current)}
      >
        {active.short}
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute top-9 right-0 z-20 w-36 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {languages.map((language) => (
            <li key={language.code}>
              <button
                type="button"
                role="option"
                aria-selected={active.code === language.code}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100"
                onClick={() => {
                  i18n.changeLanguage(language.code);
                  setOpen(false);
                }}
              >
                {t(`languages.${language.code}`)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
