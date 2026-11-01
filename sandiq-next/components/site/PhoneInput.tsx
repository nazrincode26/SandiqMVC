"use client";

import { useState } from "react";

// phone-input.js setupAzPhoneInput: formats as "+994 XX XXX XX XX" while typing.
function extractDigits(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("994")) digits = digits.slice(3);
  return digits.slice(0, 9);
}

function format(digits: string) {
  let out = "+994";
  if (digits.length > 0) out += " " + digits.slice(0, 2);
  if (digits.length > 2) out += " " + digits.slice(2, 5);
  if (digits.length > 5) out += " " + digits.slice(5, 7);
  if (digits.length > 7) out += " " + digits.slice(7, 9);
  return out;
}

export default function PhoneInput({ defaultValue, name = "Phone" }: { defaultValue?: string | null; name?: string }) {
  const [value, setValue] = useState(() => (defaultValue?.trim() ? format(extractDigits(defaultValue)) : "+994"));
  return (
    <input
      id="phoneInput"
      name={name}
      type="tel"
      inputMode="numeric"
      placeholder="+994 XX XXX XX XX"
      value={value}
      onChange={(e) => setValue(format(extractDigits(e.target.value)))}
      onBlur={(e) => setValue(format(extractDigits(e.target.value)))}
      onFocus={() => {
        if (!value.trim()) setValue("+994");
      }}
    />
  );
}
