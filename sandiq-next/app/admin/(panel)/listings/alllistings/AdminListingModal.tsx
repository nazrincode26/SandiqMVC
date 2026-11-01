"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { discardListingImages, imageFileProblem, uploadListingImages, UploadError } from "@/lib/client/upload";
import { MAX_IMAGES } from "@/lib/money";
import { AzRegionsDatalist } from "@/components/site/FormBits";
import { createAdminListing, editAdminListing } from "../../../actions";

interface AdminCategory {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
}

export interface EditableListing {
  id: number;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  subcategoryId: number | null;
  condition: string | null;
  location: string;
  images: string[];
}

type Open = (listing: EditableListing | null) => void;
const OpenContext = createContext<Open>(() => {});

export function CreateListingButton() {
  const open = useContext(OpenContext);
  return (
    <button type="button" id="createBtn" className="admin-btn admin-btn--primary" onClick={() => open(null)}>
      + Yeni elan
    </button>
  );
}

export function EditListingButton({ listing }: { listing: EditableListing }) {
  const open = useContext(OpenContext);
  return (
    <button type="button" className="admin-btn edit-listing-btn" onClick={() => open(listing)}>
      Redaktə et
    </button>
  );
}

const filterPrice = (value: string) => value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

/** The create/edit listing modal from Areas/Admin/Views/Listings/AllListings.cshtml. */
export default function AdminListingModal({ categories, children }: { categories: AdminCategory[]; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<EditableListing | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);
  const subcategories = categories.find((c) => String(c.id) === categoryId)?.subcategories ?? [];

  const open: Open = (listing) => {
    setEditing(listing);
    setCategoryId(listing ? String(listing.categoryId) : "");
    setSubcategoryId(listing?.subcategoryId ? String(listing.subcategoryId) : "");
    setPrice(listing ? String(listing.price) : "");
    setFiles([]);
    setBusy(false);
    setFormKey((k) => k + 1);
    setVisible(true);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    setBusy(true);
    const data = new FormData(form);
    data.delete("ImageFiles");
    let uploaded: string[] = [];
    try {
      uploaded = await uploadListingImages(files);
      data.set("ImagePaths", JSON.stringify(uploaded));
      const result = editing ? await editAdminListing(data) : await createAdminListing(data);
      if (result?.error === "images") alert("Şəkillər yüklənə bilmədi. Yalnız 10 MB-dan kiçik şəkil faylları qəbul olunur.");
      if (result?.error) setBusy(false);
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
        throw error;
      }
      discardListingImages(uploaded);
      alert(error instanceof UploadError ? error.message : "Xəta baş verdi, yenidən cəhd edin");
      setBusy(false);
    }
  }

  const existing = editing?.images ?? [];
  const hint = editing
    ? existing.length
      ? `Hazırda ${existing.length} şəkil var. Yeni şəkil seçsəniz, bunların yerinə keçəcək.`
      : ""
    : "";

  return (
    <OpenContext.Provider value={open}>
      {children}
      <div
        id="listingModal"
        className={`admin-modal${visible ? "" : " hidden"}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setVisible(false);
        }}
      >
        <div className="admin-modal__box admin-form">
          <h2 id="modalTitle">{editing ? "Elanı redaktə et" : "Yeni elan"}</h2>
          <p className="admin-form__subtitle">Elan məlumatlarını doldurun</p>

          <form id="listingForm" key={formKey} method="post" encType="multipart/form-data" onSubmit={onSubmit}>
            <input type="hidden" name="Id" id="formId" value={editing?.id ?? 0} />
            <section className="admin-form__section">
              <h3 className="admin-form__section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
                Əsas məlumat
              </h3>
              <label>
                Başlıq
                <input type="text" name="Title" id="formTitle" required defaultValue={editing?.title ?? ""} />
              </label>
              <label>
                Təsvir
                <textarea name="Description" id="formDescription" rows={4} defaultValue={editing?.description ?? ""}></textarea>
              </label>
            </section>

            <section className="admin-form__section">
              <h3 className="admin-form__section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                </svg>
                Kateqoriya və qiymət
              </h3>
              <div className="admin-form__grid">
                <label>
                  Kateqoriya
                  <select
                    name="CategoryId"
                    id="formCategory"
                    required
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setSubcategoryId("");
                    }}
                  >
                    <option value="">Seçin...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Alt kateqoriya
                  <select
                    name="SubcategoryId"
                    id="formSubcategory"
                    disabled={!categoryId || subcategories.length === 0}
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                  >
                    {categoryId ? (
                      <>
                        <option value="">Seçin...</option>
                        {subcategories.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </>
                    ) : (
                      <option value="">Əvvəlcə kateqoriya seçin</option>
                    )}
                  </select>
                </label>
                <label>
                  Qiymət (₼)
                  <input type="text" inputMode="decimal" name="Price" id="formPrice" required value={price} onChange={(e) => setPrice(filterPrice(e.target.value))} />
                </label>
                <label>
                  Vəziyyəti
                  <select name="Condition" id="formCondition" defaultValue={editing?.condition ?? "used"}>
                    <option value="new">Yeni</option>
                    <option value="used">İşlənmiş</option>
                  </select>
                </label>
                <label className="admin-form__full">
                  Yerləşdiyi yer
                  <input type="text" name="Location" id="formLocation" list="azRegions" autoComplete="off" placeholder="Məs. Bakı, Nəsimi" defaultValue={editing?.location ?? ""} />
                  <AzRegionsDatalist />
                </label>
              </div>
            </section>

            <section className="admin-form__section">
              <h3 className="admin-form__section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <path d="M21 15l-5-5L5 21"></path>
                </svg>
                Şəkillər (maksimum {MAX_IMAGES} ədəd)
              </h3>
              <p className="admin-form__hint" id="modalImageHint">
                {hint}
              </p>
              <input
                type="file"
                name="ImageFiles"
                id="formImages"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const next = [...files];
                  const problems: string[] = [];
                  for (const file of Array.from(e.target.files ?? [])) {
                    const problem = imageFileProblem(file);
                    if (problem) {
                      problems.push(problem);
                      continue;
                    }
                    if (next.length >= MAX_IMAGES) break;
                    next.push(file);
                  }
                  if (problems.length) alert(problems.join("\n"));
                  setFiles(next);
                }}
              />
              <div className="post-ad-previews" id="modalImagePreviews">
                {files.length === 0 &&
                  existing.map((src, i) => (
                    <div key={i} className="post-ad-preview">
                      <img src={src} alt="" />
                    </div>
                  ))}
                {previews.map((p, index) => (
                  <div key={p.url} className="post-ad-preview">
                    <img src={p.url} alt={p.file.name} />
                    <button type="button" className="post-ad-preview__remove" onClick={() => setFiles(files.filter((_, i) => i !== index))}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <div className="admin-modal__actions">
              <button type="button" id="modalCancelBtn" className="admin-btn" onClick={() => setVisible(false)}>
                Ləğv et
              </button>
              <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
                Yadda saxla
              </button>
            </div>
          </form>
        </div>
      </div>
    </OpenContext.Provider>
  );
}
