"use client";

import { useActionState } from "react";
import { ValidationSummary } from "@/components/site/FormBits";
import { createCategory, editCategory, type CategoryFormState } from "../../actions";

type Values = NonNullable<CategoryFormState["values"]>;

/** Areas/Admin/Views/Categories/Create.cshtml and Edit.cshtml */
export default function CategoryForm({ mode, initial, initialError }: { mode: "create" | "edit"; initial: Values; initialError?: string }) {
  const [state, formAction, pending] = useActionState(mode === "create" ? createCategory : editCategory, {
    values: initial,
    nameError: initialError,
  } as CategoryFormState);
  const v = state.values ?? initial;

  return (
    <form action={formAction} className="col-md-4" key={JSON.stringify(v)}>
      {mode === "edit" && <input type="hidden" name="Id" value={v.Id} />}
      <ValidationSummary messages={state.nameError ? [state.nameError] : []} />

      <div className="mb-3">
        <label htmlFor="Name" className="form-label">Ad (AZ)</label>
        <input id="Name" name="Name" className="form-control" defaultValue={v.Name} />
        {state.nameError ? (
          <span className="text-danger field-validation-error">{state.nameError}</span>
        ) : (
          <span className="text-danger field-validation-valid"></span>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="NameRu" className="form-label">Ad (RU)</label>
        <input id="NameRu" name="NameRu" className="form-control" defaultValue={v.NameRu} />
      </div>

      <div className="mb-3">
        <label htmlFor="NameEn" className="form-label">Ad (EN)</label>
        <input id="NameEn" name="NameEn" className="form-control" defaultValue={v.NameEn} />
      </div>

      <div className="mb-3">
        <label htmlFor="Icon" className="form-label">İkon URL</label>
        <input id="Icon" name="Icon" className="form-control" defaultValue={v.Icon} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        Yadda saxla
      </button>{" "}
      <a href="/admin/categories" className="btn btn-secondary">
        Ləğv et
      </a>
    </form>
  );
}
