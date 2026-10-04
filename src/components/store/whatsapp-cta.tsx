"use client";

import { WhatsappIcon } from "@/components/icons";
import { buttonClasses } from "@/components/ui/button";
import { trackEvent } from "@/features/tracking/client";

/** WhatsApp contact CTA — tracked as a Meta "Lead". */
export function WhatsappCta({ href, label, source }: { href: string; label: string; source: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent({ name: "Lead", contentName: `whatsapp_${source}` })}
      className={buttonClasses("accent", "lg")}
    >
      <WhatsappIcon size={20} />
      {label}
    </a>
  );
}
