"use client";

import { useEffect } from "react";
import { WhatsappIcon } from "@/components/icons";
import { buttonClasses } from "@/components/ui/button";
import { t } from "@/i18n";

/**
 * Sends the order to the store's WhatsApp: opens WhatsApp automatically once per order (after the
 * Purchase event has fired on this page), and keeps a button in case it was blocked or closed.
 */
export function SendOrderWhatsapp({ href, orderNumber }: { href: string; orderNumber: string }) {
  useEffect(() => {
    const key = `dh_order_wa_${orderNumber}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      return; // storage unavailable — don't risk reopening on every visit; the button still works
    }
    const timer = window.setTimeout(() => window.location.assign(href), 1500);
    return () => window.clearTimeout(timer);
  }, [href, orderNumber]);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClasses("accent", "lg")}>
      <WhatsappIcon size={20} />
      {t.success.whatsappCta}
    </a>
  );
}
