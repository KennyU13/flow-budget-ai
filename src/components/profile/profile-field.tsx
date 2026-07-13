import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

type ProfileFieldProps = {
  label: string;
  description?: string;
  error?: string;
  children: ReactElement<FieldControlProps>;
  className?: string;
};

function joinIds(...ids: Array<string | undefined>) {
  return ids.filter(Boolean).join(" ") || undefined;
}

export function ProfileField({
  label,
  description,
  error,
  children,
  className,
}: ProfileFieldProps) {
  if (!isValidElement(children)) return null;

  const id = children.props.id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const control = cloneElement(children, {
    id,
    "aria-describedby": joinIds(children.props["aria-describedby"], descriptionId, errorId),
    "aria-invalid": error ? true : undefined,
  });

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {description ? (
        <p id={descriptionId} className="mb-2 text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {control}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type { ProfileFieldProps };
