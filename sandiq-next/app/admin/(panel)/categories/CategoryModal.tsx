"use client";

import { createContext, useContext, useState } from "react";
import { createCategoryFromModal, editCategoryFromModal } from "../../actions";

interface ModalState {
  title: string;
  mode: "create" | "edit";
  id: string;
  parentId: string;
  name: string;
  nameRu: string;
  nameEn: string;
  icon: string;
  parentInfo: string | null;
}

const OpenContext = createContext<(s: ModalState) => void>(() => {});

const empty = { id: "0", parentId: "", name: "", nameRu: "", nameEn: "", icon: "", parentInfo: null };

export function CreateCategoryButton() {
  const open = useContext(OpenContext);
  return (
    <button type="button" id="createCategoryBtn" className="admin-btn admin-btn--primary" onClick={() => open({ ...empty, title: "Yeni kateqoriya", mode: "create" })}>
      + Yeni kateqoriya
    </button>
  );
}

export function AddSubButton({ id, name }: { id: number; name: string }) {
  const open = useContext(OpenContext);
  return (
    <button
      type="button"
      className="admin-btn add-sub-btn"
      onClick={() =>
        open({
          ...empty,
          title: "Yeni alt kateqoriya",
          mode: "create",
          parentId: String(id),
          parentInfo: `"${name}" kateqoriyasının alt-kateqoriyası olaraq əlavə olunacaq.`,
        })
      }
    >
      + Alt kateqoriya
    </button>
  );
}

export function EditCategoryButton({
  category,
}: {
  category: { id: number; name: string; nameRu: string | null; nameEn: string | null; icon: string | null };
}) {
  const open = useContext(OpenContext);
  return (
    <button
      type="button"
      className="admin-btn edit-category-btn"
      onClick={() =>
        open({
          ...empty,
          title: "Kateqoriyanı redaktə et",
          mode: "edit",
          id: String(category.id),
          name: category.name,
          nameRu: category.nameRu ?? "",
          nameEn: category.nameEn ?? "",
          icon: category.icon ?? "",
        })
      }
    >
      Redaktə et
    </button>
  );
}

/** The add/edit category modal from Areas/Admin/Views/Categories/Index.cshtml. */
export default function CategoryModal({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);

  return (
    <OpenContext.Provider value={setState}>
      {children}
      <div
        id="categoryModal"
        className={`admin-modal${state ? "" : " hidden"}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setState(null);
        }}
      >
        <div className="admin-modal__box admin-form">
          <h2 id="modalTitle">{state?.title ?? "Yeni kateqoriya"}</h2>
          <form
            id="categoryForm"
            key={JSON.stringify(state)}
            action={state?.mode === "edit" ? editCategoryFromModal : createCategoryFromModal}
          >
            <input type="hidden" name="Id" id="formId" value={state?.id ?? "0"} />
            <input type="hidden" name="ParentId" id="formParentId" value={state?.parentId ?? ""} />
            <label>
              Ad (AZ)
              <input type="text" name="Name" id="formName" required defaultValue={state?.name} />
            </label>
            <label>
              Ad (RU)
              <input type="text" name="NameRu" id="formNameRu" defaultValue={state?.nameRu} />
            </label>
            <label>
              Ad (EN)
              <input type="text" name="NameEn" id="formNameEn" defaultValue={state?.nameEn} />
            </label>
            <label>
              İkon URL (istəyə bağlı)
              <input type="text" name="Icon" id="formIcon" defaultValue={state?.icon} />
            </label>
            <p id="parentInfo" className={`category-form__parent-info${state?.parentInfo ? "" : " hidden"}`}>
              {state?.parentInfo}
            </p>
            <div className="admin-modal__actions">
              <button type="button" id="modalCancelBtn" className="admin-btn" onClick={() => setState(null)}>
                Ləğv et
              </button>
              <button type="submit" className="admin-btn admin-btn--primary">
                Yadda saxla
              </button>
            </div>
          </form>
        </div>
      </div>
    </OpenContext.Provider>
  );
}
