import { ChevronDownIcon } from "@/components/icons";

export function FaqList({ items, className }: { items: Array<{ q: string; a: string }>; className?: string }) {
  return (
    <div className={className}>
      {items.map((item, i) => (
        <details key={i} className="group border-b border-line py-1 last:border-b-0">
          <summary className="flex cursor-pointer items-center justify-between gap-4 rounded-md py-4 text-start text-[0.95rem] font-medium text-plum-950">
            {item.q}
            <ChevronDownIcon size={18} className="shrink-0 text-subtle transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="pb-5 text-sm leading-7 text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  index,
  title,
  description,
  action,
  id,
}: {
  eyebrow?: string;
  /** Editorial section number ("01"), echoing the identity's numbered page headers. */
  index?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div>
        {eyebrow && (
          <p className="eyebrow mb-2 flex items-center gap-2">
            {index && (
              <>
                <span className="font-semibold text-plum-950 tabular-nums">{index}</span>
                <span className="h-px w-6 bg-lavender-400" aria-hidden="true" />
              </>
            )}
            {eyebrow}
          </p>
        )}
        <h2 id={id} className="scroll-mt-28 text-xl font-semibold tracking-tight text-plum-950 sm:text-2xl lg:text-[1.75rem]">
          {title}
        </h2>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
