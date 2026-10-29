"use client";

import { Clapperboard, Image as ImageIcon, Images } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeCampaignOffer } from "@/app/[locale]/operator/(dashboard)/actions";
import { LatinRun } from "@/components/latin-run";
import { useOperatorFeedback } from "@/components/operator-feedback";
import { BusyButton } from "@/components/submit-button";
import { cardClass } from "@/components/operator-classes";
import { messagesFor, type Locale } from "@/i18n/config";
import { fillMessage } from "@/lib/fill-message";
import { slotText } from "@/lib/operator-copy";

const slotOrder = ["main_video", "main_image", "gallery_1", "gallery_2", "gallery_3"] as const;

export type CampaignOfferView = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  price: string;
  start: string;
  end: string;
  status: string;
  filled: string[];
};

function statusLabel(locale: Locale, status: string) {
  const messages = messagesFor(locale);
  if (status === "visible") return messages.operator.statusVisible;
  if (status === "scheduled") return messages.operator.statusScheduled;
  if (status === "ended") return messages.operator.statusEnded;
  if (status === "hidden") return messages.operator.statusHidden;
  return status;
}

function SlotMark({ slot }: { slot: string }) {
  if (slot === "main_video") return <Clapperboard className="size-4" aria-hidden="true" />;
  if (slot.startsWith("gallery")) return <Images className="size-4" aria-hidden="true" />;
  return <ImageIcon className="size-4" aria-hidden="true" />;
}

export function CampaignOfferList({ locale, rows }: { locale: Locale; rows: CampaignOfferView[] }) {
  const messages = messagesFor(locale);
  const { toast, confirm } = useOperatorFeedback();
  const router = useRouter();
  const [visible, setVisible] = useState(rows);
  const [hiding, setHiding] = useState("");
  const [pending, setPending] = useState("");

  async function remove(id: string, code: string) {
    if (pending) return;
    const accepted = await confirm(
      messages.operator.remove,
      fillMessage(messages.operator.removeConfirm, { code }),
    );
    if (!accepted) return;
    setPending(id);
    const outcome = await removeCampaignOffer(locale, id);
    setPending("");
    if (!outcome.ok) {
      toast(messages.operator.rejected, "alert");
      return;
    }
    toast(outcome.storageFailed ? messages.operator.storageFailed : messages.operator.removed, outcome.storageFailed ? "alert" : "status");
    setHiding(id);
    window.setTimeout(() => {
      setVisible((current) => current.filter((row) => row.id !== id));
      setHiding("");
    }, 300);
    router.refresh();
  }

  if (visible.length === 0) return <p>{messages.operator.emptyCampaignOffers}</p>;

  const table = (
    <div className="hidden min-w-0 lg:block">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-start">
            <th className="px-2 py-2 text-start">{messages.operator.columnCode}</th>
            <th className="px-2 py-2 text-start">{messages.operator.columnNameAr}</th>
            <th className="px-2 py-2 text-start">{messages.operator.columnNameEn}</th>
            <th className="px-2 py-2 text-start">{messages.operator.columnPrice}</th>
            <th className="px-2 py-2 text-start">{messages.operator.columnStart}</th>
            <th className="px-2 py-2 text-start">{messages.operator.columnEnd}</th>
            <th className="px-2 py-2 text-start">{messages.operator.columnStatus}</th>
            <th className="px-2 py-2 text-start">{messages.operator.columnSlots}</th>
            <th className="px-2 py-2 text-start">{messages.operator.remove}</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.id} data-code={row.code} className={hiding === row.id ? "opacity-0 transition-opacity motion-reduce:transition-none" : ""}>
              <td className="px-2 py-2"><LatinRun>{row.code}</LatinRun></td>
              <td className="px-2 py-2 break-words">{row.nameAr}</td>
              <td className="px-2 py-2 break-words"><LatinRun>{row.nameEn}</LatinRun></td>
              <td className="px-2 py-2"><LatinRun>{row.price}</LatinRun></td>
              <td className="px-2 py-2"><LatinRun>{row.start}</LatinRun></td>
              <td className="px-2 py-2"><LatinRun>{row.end}</LatinRun></td>
              <td className="px-2 py-2">{statusLabel(locale, row.status)}</td>
              <td className="px-2 py-2"><SlotRow locale={locale} filled={row.filled} /></td>
              <td className="px-2 py-2">
                <BusyButton
                  busy={pending === row.id}
                  quiet
                  label={messages.operator.remove}
                  pendingLabel={messages.operator.pending}
                  onClick={() => void remove(row.id, row.code)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {table}
      <ul className="flex flex-col gap-3 lg:hidden">
        {visible.map((row) => (
          <li key={row.id} data-code={row.code} className={`${cardClass} ${hiding === row.id ? "opacity-0 transition-opacity motion-reduce:transition-none" : ""}`}>
            <p className="text-sm"><LatinRun>{row.code}</LatinRun></p>
            <p className="break-words">{row.nameAr}</p>
            <p className="break-words"><LatinRun>{row.nameEn}</LatinRun></p>
            <p><LatinRun>{row.price}</LatinRun></p>
            <p><LatinRun>{row.start}</LatinRun> – <LatinRun>{row.end}</LatinRun></p>
            <p>{statusLabel(locale, row.status)}</p>
            <SlotRow locale={locale} filled={row.filled} />
            <BusyButton
              busy={pending === row.id}
              quiet
              label={messages.operator.remove}
              pendingLabel={messages.operator.pending}
              onClick={() => void remove(row.id, row.code)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

function SlotRow({ locale, filled }: { locale: Locale; filled: string[] }) {
  const messages = messagesFor(locale);
  const held = new Set(filled);
  return (
    <span className="inline-flex flex-wrap gap-2">
      {slotOrder.map((slot) => {
        const present = held.has(slot);
        return (
          <span
            key={slot}
            data-filled={present ? "yes" : "no"}
            aria-label={slotText(messages, slot)}
            className={present ? "text-primary" : "text-muted"}
          >
            <SlotMark slot={slot} />
          </span>
        );
      })}
    </span>
  );
}
