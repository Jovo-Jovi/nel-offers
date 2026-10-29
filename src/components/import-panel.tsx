"use client";

import { useRef, useState } from "react";
import { LoaderCircle as Loader2, Sheet } from "lucide-react";
import { messagesFor, type Locale } from "@/i18n/config";
import { cardClass, primaryButton, quietButton } from "@/components/operator-classes";
import { LatinRun } from "@/components/latin-run";
import { useOperatorFeedback } from "@/components/operator-feedback";
import { BusyButton } from "@/components/submit-button";
import { fillMessage } from "@/lib/fill-message";
import { formatByteSize, formatCount, megabytes } from "@/lib/format-values";
import { sheetErrorText, warningText } from "@/lib/operator-copy";
import { workbookByteLimit } from "@/lib/sheet-format";

type ErrorView = { row: number; column: string; cell: string; kind: string };
type WarningView = { row: number; kind: string };
type AdditionView = {
  code: string;
  name_ar: string;
  name_en: string;
  price_egp: string;
  starts_on: string | null;
  ends_on: string;
};
type ChangeView = { field: string; previous: string; next: string };
type UpdateView = { code: string; changes: ChangeView[] };
type PreviewView = {
  sheetSha256: string;
  expectedCount: number;
  expectedUpdatedAt: string | null;
  errors: ErrorView[];
  warnings: WarningView[];
  additions: AdditionView[];
  updates: UpdateView[];
  unchangedCount: number;
  published: boolean;
};

export function ImportPanel({ locale }: { locale: Locale }) {
  const messages = messagesFor(locale);
  const { toast } = useOperatorFeedback();
  const [workbook, setWorkbook] = useState<Blob | null>(null);
  const [sheetLabel, setSheetLabel] = useState("");
  const [sheetBytes, setSheetBytes] = useState(0);
  const picker = useRef<HTMLInputElement>(null);
  const previewStep = useRef<HTMLDivElement>(null);
  const ticket = useRef(0);
  const [preview, setPreview] = useState<PreviewView | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [confirmed, setConfirmed] = useState("");

  async function owned(blob: Blob) {
    return new Blob([new Uint8Array(await blob.arrayBuffer())], { type: blob.type });
  }

  async function hold(blob: Blob) {
    if (blob.size > workbookByteLimit) {
      toast(fillMessage(messages.operator.codeTooLarge, { megabytes: megabytes(workbookByteLimit) }), "alert");
      return;
    }
    const stamp = ticket.current + 1;
    ticket.current = stamp;
    const title = blob instanceof File ? blob.name : "";
    if (title) setSheetLabel(title);
    setSheetBytes(blob.size);
    setPreview(null);
    setNotice("");
    setConfirmed("");
    setBusy(true);
    setReading(true);
    const chosen = await owned(blob);
    if (ticket.current !== stamp) return;
    setWorkbook(chosen);
    const form = new FormData();
    form.append("workbook", chosen, "sheet.xlsx");
    const response = await fetch("/api/operator/campaign-imports/preview", { method: "POST", body: form });
    const body = (await response.json()) as PreviewView & { code?: string };
    if (ticket.current !== stamp) return;
    setBusy(false);
    setReading(false);
    if (!response.ok) {
      const code = body.code ?? "rejected";
      if (code === "too-large") {
        toast(fillMessage(messages.operator.codeTooLarge, { megabytes: megabytes(workbookByteLimit) }), "alert");
      } else if (code === "not-a-workbook") toast(messages.operator.notWorkbook, "alert");
      else toast(messages.operator.rejected, "alert");
      return;
    }
    setPreview(body);
    previewStep.current?.scrollIntoView({ block: "start" });
  }

  function onPick(list: FileList | null) {
    const picked = list?.[0] ?? null;
    if (picker.current) picker.current.value = "";
    if (picked) void hold(picked);
  }

  async function runConfirm() {
    if (!workbook || !preview || preview.errors.length > 0 || busy) return;
    const chosen = workbook;
    setBusy(true);
    setNotice("");
    const form = new FormData();
    form.append("workbook", chosen, "sheet.xlsx");
    form.append("sheetSha256", preview.sheetSha256);
    form.append("expectedCount", String(preview.expectedCount));
    form.append("expectedUpdatedAt", preview.expectedUpdatedAt ?? "");
    const response = await fetch("/api/operator/campaign-imports/confirm", { method: "POST", body: form });
    const body = (await response.json()) as { code?: string; added?: number; updated?: number; unchanged?: number };
    setBusy(false);
    if (!response.ok) {
      const code = body.code ?? "rejected";
      if (code === "changed-since-preview" || code === "sheet-changed") {
        setNotice(code === "sheet-changed" ? messages.operator.sheetChanged : messages.operator.previewAgain);
        toast(code === "sheet-changed" ? messages.operator.sheetChanged : messages.operator.previewAgain, "alert");
      } else if (code === "sheet-errors") toast(messages.operator.sheetErrors, "alert");
      else toast(messages.operator.rejected, "alert");
      return;
    }
    const summary = fillMessage(messages.operator.confirmedSummary, {
      added: body.added ?? 0,
      updated: body.updated ?? 0,
      unchanged: body.unchanged ?? 0,
    });
    setConfirmed(summary);
    toast(summary, "status");
    setPreview(null);
  }

  const summary = preview
    ? preview.errors.length > 0
      ? fillMessage(messages.operator.previewErrorSummary, { count: formatCount(locale, preview.errors.length) })
      : fillMessage(messages.operator.previewReadySummary, {
          additions: formatCount(locale, preview.additions.length),
          updates: formatCount(locale, preview.updates.length),
          unchanged: formatCount(locale, preview.unchangedCount),
        })
    : "";

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-lg">1. {messages.operator.stepGet}</h2>
        <div className="flex flex-wrap gap-3">
          {/* Attachment responses, not navigations. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className={primaryButton} href="/api/operator/campaign-template">
            {messages.operator.downloadTemplate}
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className={quietButton} href="/api/operator/campaign-export">
            {messages.operator.exportCurrent}
          </a>
        </div>
      </section>
      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-lg">2. {messages.operator.stepChoose}</h2>
        <div
          data-drop-zone="true"
          className={`${cardClass} border border-dashed border-border`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onPick(event.dataTransfer.files);
          }}
        >
          <p className="text-sm">{messages.operator.dropWorkbook}</p>
          <input
            id="workbook"
            ref={picker}
            className="sr-only"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => onPick(event.currentTarget.files)}
          />
          {sheetLabel ? (
            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-3">
              <Sheet className="size-5" aria-hidden="true" />
              <span data-sheet-name className="min-w-0 break-all">{sheetLabel}</span>
              <span data-byte-size>{formatByteSize(locale, sheetBytes)}</span>
              <label htmlFor="workbook" className={`${quietButton} cursor-pointer`}>
                {messages.operator.chooseAnother}
              </label>
              <BusyButton
                busy={busy}
                disabled={!workbook}
                label={messages.operator.previewAgainAction}
                pendingLabel={messages.operator.pending}
                onClick={() => {
                  if (workbook) void hold(workbook);
                }}
              />
            </div>
          ) : (
            <label htmlFor="workbook" className="mt-3 inline-flex cursor-pointer">
              <span className="rounded-button bg-primary px-4 py-2 text-sm text-surface">{messages.operator.chooseWorkbook}</span>
            </label>
          )}
        </div>
      </section>
      <div ref={previewStep} className="flex min-w-0 flex-col gap-3">
        <h2 className="text-lg">3. {messages.operator.stepPreview}</h2>
        {reading ? (
          <p className="flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {messages.operator.readingSheet}
          </p>
        ) : null}
        {preview ? (
          <div className="flex min-w-0 flex-col gap-4">
            <p data-preview-summary>{summary}</p>
            {preview.errors.length > 0 ? (
              <section>
                <h2 className="text-lg">{messages.operator.errorHeading}</h2>
                <div className="min-w-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-2 py-2 text-start">{messages.operator.columnName}</th>
                        <th className="px-2 py-2 text-start">{messages.operator.cellValue}</th>
                        <th className="px-2 py-2 text-start">{messages.operator.reason}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.errors.map((error, index) => (
                        <tr key={`${error.row}-${error.column}-${index}`}>
                          <td className="px-2 py-2"><LatinRun>{error.row}</LatinRun> <LatinRun>{error.column}</LatinRun></td>
                          <td className="px-2 py-2 break-all">{error.cell}</td>
                          <td className="px-2 py-2">{sheetErrorText(messages, error.kind, error.column)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
            {preview.warnings.length > 0 ? (
              <section>
                <h2 className="text-lg">{messages.operator.warningHeading}</h2>
                <ul>
                  {preview.warnings.map((warning, index) => (
                    <li key={`${warning.kind}-${warning.row}-${index}`}>
                      <LatinRun>{warning.row}</LatinRun> {warningText(messages, warning.kind)}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <section>
              <h2 className="text-lg">{messages.operator.additionHeading}</h2>
              <p><LatinRun>{formatCount(locale, preview.additions.length)}</LatinRun></p>
              <ul>
                {preview.additions.map((row) => (
                  <li key={row.code}>
                    <LatinRun>{row.code}</LatinRun> {row.name_ar} <LatinRun>{row.name_en}</LatinRun> <LatinRun>{row.price_egp}</LatinRun>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-lg">{messages.operator.updateHeading}</h2>
              <p><LatinRun>{formatCount(locale, preview.updates.length)}</LatinRun></p>
              <ul>
                {preview.updates.map((row) => (
                  <li key={row.code}>
                    <LatinRun>{row.code}</LatinRun>
                    <ul>
                      {row.changes.map((change) => (
                        <li key={change.field}>
                          <LatinRun>{change.field}</LatinRun> <LatinRun>{change.previous}</LatinRun> <LatinRun>{change.next}</LatinRun>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
            <p>{fillMessage(messages.operator.unchangedSummary, { count: preview.unchangedCount })}</p>
          </div>
        ) : null}
      </div>
      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-lg">4. {messages.operator.stepConfirm}</h2>
        <BusyButton
          busy={busy}
          disabled={!preview || preview.errors.length > 0}
          label={preview?.published ? messages.operator.confirmLive : messages.operator.confirmImport}
          pendingLabel={messages.operator.pending}
          onClick={() => void runConfirm()}
        />
      </section>
      {notice ? <p role="alert">{notice}</p> : null}
      {confirmed ? <p role="status">{confirmed}</p> : null}
    </div>
  );
}
