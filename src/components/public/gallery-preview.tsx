"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { LatinRun } from "@/components/latin-run";
import { defaultLocale, type Locale } from "@/i18n/config";

const dragMinimum = 50;

const previewFit =
  "block h-auto w-[min(calc(100vw-3rem),calc((100dvh-3rem)*var(--preview-ratio,1)))] md:w-[min(calc(100vw-8rem),calc((100dvh-3rem)*var(--preview-ratio,1)))]";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export type PreviewPicture = {
  url: string;
  label: string;
};

type PreviewController = {
  openAt: (index: number, opener: HTMLElement) => void;
};

const PreviewContext = createContext<PreviewController | null>(null);

export function usePreview() {
  const controller = useContext(PreviewContext);
  if (!controller) throw new Error("missing-preview");
  return controller;
}

type GalleryPreviewProps = {
  pictures: readonly PreviewPicture[];
  locale: Locale;
  previousLabel: string;
  nextLabel: string;
  closeLabel: string;
  children: ReactNode;
};

function isButton(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("button"));
}

function isBackdrop(target: EventTarget | null, dialog: HTMLDialogElement) {
  if (target === dialog) return true;
  return target instanceof HTMLElement && target.dataset.backdrop === "true";
}

export function GalleryPreview({
  pictures,
  locale,
  previousLabel,
  nextLabel,
  closeLabel,
  children,
}: GalleryPreviewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const pointerRef = useRef<{ x: number; backdrop: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const picture = pictures[index] ?? null;

  function move(step: number) {
    setIndex((current) => {
      const next = current + step;
      if (next < 0 || next >= pictures.length) return current;
      return next;
    });
  }

  const openAt = (nextIndex: number, opener: HTMLElement) => {
    if (pictures.length === 0) return;
    openerRef.current = opener;
    setIndex(nextIndex);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      const forward = locale === defaultLocale ? event.key === "ArrowLeft" : event.key === "ArrowRight";
      const backward = locale === defaultLocale ? event.key === "ArrowRight" : event.key === "ArrowLeft";
      if (!forward && !backward) return;
      event.preventDefault();
      setIndex((current) => {
        const next = current + (forward ? 1 : -1);
        if (next < 0 || next >= pictures.length) return current;
        return next;
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, locale, pictures.length]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    document.documentElement.classList.add("public-scroll-lock");
    if (!dialog.open) dialog.showModal();
    return () => {
      document.documentElement.classList.remove("public-scroll-lock");
      if (dialog.open) dialog.close();
    };
  }, [open]);

  function onDialogClose() {
    setOpen(false);
    openerRef.current?.focus();
  }

  function onPointerDown(event: PointerEvent<HTMLDialogElement>) {
    if (isButton(event.target)) {
      pointerRef.current = null;
      return;
    }
    pointerRef.current = {
      x: event.clientX,
      backdrop: isBackdrop(event.target, event.currentTarget),
    };
  }

  function onPointerUp(event: PointerEvent<HTMLDialogElement>) {
    const start = pointerRef.current;
    pointerRef.current = null;
    if (!start || isButton(event.target)) return;
    const delta = event.clientX - start.x;
    const forward = locale === defaultLocale ? delta > dragMinimum : delta < -dragMinimum;
    const backward = locale === defaultLocale ? delta < -dragMinimum : delta > dragMinimum;
    if (forward) {
      move(1);
      return;
    }
    if (backward) {
      move(-1);
      return;
    }
    if (start.backdrop && isBackdrop(event.target, event.currentTarget)) setOpen(false);
  }

  return (
    <PreviewContext.Provider value={{ openAt }}>
      {children}
      <dialog
        ref={dialogRef}
        className="public-preview bg-transparent p-0"
        onClose={onDialogClose}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div data-backdrop="true" className="absolute inset-0 grid place-items-center">
          {picture && open ? (
            // CSP has no style-src, and next/image writes an inline style.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={picture.url}
              src={picture.url}
              alt={picture.label}
              className={previewFit}
              onLoad={(event) => {
                const image = event.currentTarget;
                if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                  image.style.setProperty("--preview-ratio", String(image.naturalWidth / image.naturalHeight));
                }
              }}
            />
          ) : null}
        </div>
        <button
          type="button"
          className={`absolute start-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-button bg-surface text-primary shadow-card disabled:opacity-40 ${focusRing}`}
          aria-label={previousLabel}
          disabled={index === 0}
          onClick={() => move(-1)}
        >
          <ChevronLeft className="h-6 w-6 public-mirror-rtl" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`absolute end-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-button bg-surface text-primary shadow-card disabled:opacity-40 ${focusRing}`}
          aria-label={nextLabel}
          disabled={index >= pictures.length - 1}
          onClick={() => move(1)}
        >
          <ChevronRight className="h-6 w-6 public-mirror-rtl" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`absolute end-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-button bg-surface text-primary shadow-card ${focusRing}`}
          aria-label={closeLabel}
          onClick={() => setOpen(false)}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="absolute inset-x-0 bottom-4 z-10 text-center text-sm font-bold text-surface">
          <LatinRun>
            {index + 1} / {pictures.length}
          </LatinRun>
        </p>
      </dialog>
    </PreviewContext.Provider>
  );
}
