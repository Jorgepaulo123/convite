import { INVITE_BODY } from "@/lib/site-meta";

export function InviteMessage() {
  return (
    <section id="convite" className="px-6 py-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.45em] text-primary">{INVITE_BODY.label}</p>
      <h2 className="font-script text-gold-gradient mt-3 text-5xl leading-tight md:text-6xl">{INVITE_BODY.names}</h2>
      <div className="mx-auto my-6 h-px w-24 bg-gold-gradient" />
      <div className="glass mx-auto max-w-prose space-y-4 rounded-3xl p-6 text-left text-sm leading-relaxed text-foreground md:text-base">
        {INVITE_BODY.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="pt-2 text-center text-xs font-semibold uppercase tracking-wide text-primary md:text-sm">
          {INVITE_BODY.closing}
        </p>
      </div>
    </section>
  );
}
