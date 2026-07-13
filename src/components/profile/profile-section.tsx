import type { ReactNode } from "react";

type ProfileSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function ProfileSection({ title, description, children }: ProfileSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-white p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
