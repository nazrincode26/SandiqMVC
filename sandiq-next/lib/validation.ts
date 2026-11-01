// Validation rules and messages copied from the original view models and controllers.

export type FieldErrors = Record<string, string[]>;

export interface FormState<V = Record<string, string>> {
  /** Summary errors (ModelState errors with an empty key). */
  summary?: string[];
  fields?: FieldErrors;
  values?: V;
  success?: boolean;
}

// Matches what jQuery Validation and [EmailAddress] accept in practice.
const EMAIL_RE = /^[^\s@]+@[^\s@]+$/;

export function isEmail(value: string) {
  return EMAIL_RE.test(value);
}

export function addError(errors: FieldErrors, field: string, message: string) {
  (errors[field] ??= []).push(message);
}

export function hasErrors(errors: FieldErrors) {
  return Object.keys(errors).length > 0;
}

/** All messages in display order: field errors first (per ModelState), as asp-validation-summary="All" lists them. */
export function allMessages(state: FormState | undefined): string[] {
  if (!state) return [];
  return [...Object.values(state.fields ?? {}).flat(), ...(state.summary ?? [])];
}

export function requireEmail(errors: FieldErrors, field: string, value: string) {
  if (!value.trim()) addError(errors, field, "E-poçt tələb olunur");
  else if (!isEmail(value.trim())) addError(errors, field, "Düzgün e-poçt daxil edin");
}

/**
 * AccountController.NormalizePhone. Returns the normalized phone (or null) and
 * an error message when the value is invalid.
 */
export function normalizePhone(
  phone: string | null | undefined,
  required: boolean
): { phone: string | null; error?: string } {
  const trimmed = phone?.trim() ?? "";
  if (!trimmed || trimmed === "+994") {
    return required ? { phone: null, error: "Telefon nömrəsi tələb olunur." } : { phone: null };
  }
  if (!/^\+994 \d{2} \d{3} \d{2} \d{2}$/.test(trimmed)) {
    return { phone: trimmed, error: "Telefon nömrəsi düzgün formatda deyil (+994 XX XXX XX XX)." };
  }
  return { phone: trimmed };
}

export const str = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

export const optionalInt = (raw: string): number | null => {
  if (!/^\d+$/.test(raw.trim())) return null;
  return Number(raw.trim());
};
