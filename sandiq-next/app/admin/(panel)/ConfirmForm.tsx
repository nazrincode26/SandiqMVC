"use client";

/** A POST form with an optional confirm() prompt, like onsubmit="return confirm(...)". */
export default function ConfirmForm({
  action,
  id,
  message,
  className,
  children,
}: {
  action: (form: FormData) => Promise<void>;
  id: string | number;
  message?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (message && !confirm(message)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {children}
    </form>
  );
}
