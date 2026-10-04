"use client";

import { useState, type FormEvent } from "react";
import { StarIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

export function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          authorName: String(form.get("authorName") ?? ""),
          comment: String(form.get("comment") ?? ""),
          website: String(form.get("website") ?? ""), // honeypot
        }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? t.errors.title);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : t.errors.title);
    }
  }

  if (status === "done") return <Alert tone="success">{t.product.reviewThanks}</Alert>;

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t.product.writeReview}
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4 rounded-xl border border-line bg-paper p-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-plum-950">{t.product.reviewRating}</legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} من 5`}
              onClick={() => setRating(n)}
              className={cn("grid size-10 place-items-center rounded-full hover:bg-sun-50", n <= rating ? "text-sun-400" : "text-line-strong")}
            >
              <StarIcon size={24} filled={n <= rating} />
            </button>
          ))}
        </div>
      </fieldset>
      <Field id="review-name" label={t.product.reviewName}>
        <Input id="review-name" name="authorName" required minLength={2} maxLength={40} autoComplete="given-name" />
      </Field>
      <Field id="review-comment" label={t.product.reviewComment}>
        <Textarea id="review-comment" name="comment" required minLength={5} maxLength={600} rows={4} />
      </Field>
      {/* Honeypot: hidden from humans */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="review-website">Website</label>
        <input id="review-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" loading={status === "sending"}>
        {t.product.reviewSubmit}
      </Button>
    </form>
  );
}
