"use client";

import { deleteListingAction } from "../actions";

/** Delete form with the original confirm() prompt. */
export default function DeleteListingButton({ id, label }: { id: number; label: string }) {
  return (
    <form
      action={deleteListingAction}
      style={{ display: "inline" }}
      onSubmit={(e) => {
        if (!confirm("Bu elanın silinməsi üçün admin təsdiqi tələb olunacaq. Davam edilsin?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="my-listing-row__delete">{label}</button>
    </form>
  );
}
