"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { messagesFor, type Locale } from "@/i18n/config";
import { dangerButton, quietButton } from "@/components/operator-classes";

type Toast = { id: number; message: string; tone: "status" | "alert" };
type Ask = { title: string; body: string; resolve: (accepted: boolean) => void };

type Feedback = {
  toast: (message: string, tone: "status" | "alert") => void;
  confirm: (title: string, body: string) => Promise<boolean>;
};

const FeedbackContext = createContext<Feedback | null>(null);

export function useOperatorFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error("missing-feedback");
  return value;
}

export function OperatorFeedback({ locale, children }: { locale: Locale; children: ReactNode }) {
  const messages = messagesFor(locale);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ask, setAsk] = useState<Ask | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sequence = useRef(0);
  const closing = useRef(false);

  const toast = (message: string, tone: "status" | "alert") => {
    sequence.current += 1;
    const id = sequence.current;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((notice) => notice.id !== id));
    }, 4 * 1000);
  };

  const confirm = (title: string, body: string) =>
    new Promise<boolean>((resolve) => {
      setAsk({ title, body, resolve });
    });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (ask && !dialog.open) dialog.showModal();
    if (!ask && dialog.open) dialog.close();
  }, [ask]);

  function finish(accepted: boolean) {
    if (accepted) closing.current = true;
    setAsk((current) => {
      current?.resolve(accepted);
      return null;
    });
  }

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 start-4 end-4 z-20 flex flex-col gap-2">
        {toasts.map((notice) =>
          notice.tone === "alert" ? (
            <p key={notice.id} role="alert" className="nel-toast motion-reduce:animate-none pointer-events-auto rounded-card bg-surface px-4 py-3 text-sm text-error shadow-card">
              {notice.message}
            </p>
          ) : (
            <p key={notice.id} role="status" aria-live="polite" className="nel-toast motion-reduce:animate-none pointer-events-auto rounded-card bg-surface px-4 py-3 text-sm shadow-card">
              {notice.message}
            </p>
          ),
        )}
      </div>
      <dialog
        ref={dialogRef}
        className="nel-dialog p-6"
        onClose={() => {
          if (closing.current) {
            closing.current = false;
            return;
          }
          finish(false);
        }}
      >
        <h2 className="text-lg font-medium">{ask?.title}</h2>
        <p className="mt-3 text-sm">{ask?.body}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className={quietButton} onClick={() => finish(false)}>
            {messages.operator.cancel}
          </button>
          <button type="button" className={dangerButton} onClick={() => finish(true)}>
            {messages.operator.confirm}
          </button>
        </div>
      </dialog>
    </FeedbackContext.Provider>
  );
}
