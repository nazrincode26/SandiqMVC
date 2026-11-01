"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/lib/client/lang";
import { showToast } from "@/lib/client/store";
import { discardListingImages, imageFileProblem, uploadListingImages, UploadError } from "@/lib/client/upload";
import { localName } from "@/lib/i18n";
import { MAX_IMAGES, PLATFORM_FEE_RATE } from "@/lib/money";
import type { FieldErrors } from "@/lib/validation";
import { AzRegionsDatalist, FieldError, ValidationSummary } from "@/components/site/FormBits";
import { checkListingAction, createListingAction, editListingAction, type ListingFormResult } from "./actions";

export interface ListingCategory {
  id: number;
  name: string;
  nameRu: string;
  nameEn: string;
  subcategories: { id: number; name: string; nameRu: string; nameEn: string }[];
}

export interface ListingInitial {
  id: number;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  subcategoryId: number | null;
  condition: string;
  location: string | null;
  existingImages: string[];
}

interface Props {
  mode: "create" | "edit";
  categories: ListingCategory[];
  titleKeywords: string[];
  initial?: ListingInitial;
}

const filterPrice = (value: string) => value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

function feeNote(priceText: string) {
  const price = parseFloat(priceText);
  if (!price || price <= 0) return "";
  const fee = Math.round(price * PLATFORM_FEE_RATE * 100) / 100;
  const netAmount = Math.round((price - fee) * 100) / 100;
  return `Bu qiymətdən sizə çatacaq: ${netAmount} ₼ · Platform xidmət haqqı (${Math.round(PLATFORM_FEE_RATE * 100)}%): ${fee} ₼`;
}

/** Views/Listings/Create.cshtml and Edit.cshtml with their page scripts. */
export default function ListingForm({ mode, categories, titleKeywords, initial }: Props) {
  const { lang, t } = useLang();
  const isCreate = mode === "create";
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categoryId, setCategoryId] = useState(initial ? String(initial.categoryId) : "");
  const [subcategoryId, setSubcategoryId] = useState(initial?.subcategoryId ? String(initial.subcategoryId) : "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [titleError, setTitleError] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragover, setDragover] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverMessages, setServerMessages] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  const keywordSet = useMemo(() => new Set(titleKeywords.map((k) => k.toLowerCase())), [titleKeywords]);
  const subcategories = categories.find((c) => String(c.id) === categoryId)?.subcategories ?? [];
  const [subTouched, setSubTouched] = useState(Boolean(initial));
  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  function validateTitle() {
    const valid = keywordSet.has((titleRef.current?.value ?? "").trim().toLowerCase());
    setTitleError(!valid);
    titleRef.current?.setCustomValidity(valid ? "" : "Yalnız siyahıdan bir söz seçin.");
    return valid;
  }

  function addFiles(list: File[]) {
    const next = [...files];
    for (const file of list) {
      const problem = imageFileProblem(file);
      if (problem) {
        showToast(problem, "error");
        continue;
      }
      if (next.length >= MAX_IMAGES) {
        showToast(`Maksimum ${MAX_IMAGES} şəkil yükləyə bilərsiniz`);
        break;
      }
      next.push(file);
    }
    setFiles(next);
  }

  function clientValidate(form: HTMLFormElement): FieldErrors {
    const data = new FormData(form);
    const errors: FieldErrors = {};
    if (!String(data.get("Title") ?? "").trim()) errors.Title = ["Başlıq tələb olunur"];
    if (!String(data.get("Description") ?? "").trim()) errors.Description = ["Təsvir tələb olunur"];
    const priceValue = String(data.get("Price") ?? "").trim();
    if (!priceValue) errors.Price = ["Qiymət tələb olunur"];
    else if (!/^\d+(\.\d+)?$/.test(priceValue)) errors.Price = ["The field Qiymət (₼) must be a number."];
    if (!String(data.get("CategoryId") ?? "")) errors.CategoryId = ["Kateqoriya seçin"];
    return errors;
  }

  function showResult(result: ListingFormResult) {
    const fields = result.fields ?? {};
    setFieldErrors(fields);
    setServerMessages([...Object.values(fields).flat(), ...(result.summary ?? [])]);
    setBusy(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const errors = clientValidate(form);
    setFieldErrors(errors);
    const titleOk = validateTitle();
    if (!titleOk) titleRef.current?.focus();
    if (isCreate && !accepted) setTermsOpen(true);
    if (!titleOk || Object.keys(errors).length || (isCreate && !accepted)) return;

    setBusy(true);
    const data = new FormData(form);
    data.delete("ImageFiles");
    data.set("AcceptTerms", accepted ? "true" : "false");
    data.set("ImageCount", String(files.length));
    if (initial) data.set("Id", String(initial.id));

    let uploaded: string[] = [];
    try {
      const check = await checkListingAction(mode, data);
      if (Object.keys(check.fields ?? {}).length || check.summary?.length) return showResult(check);

      uploaded = check.pendingExists ? [] : await uploadListingImages(files);
      data.set("ImagePaths", JSON.stringify(uploaded));
      const result = isCreate ? await createListingAction(data) : await editListingAction(data);
      // A returned result means the listing was not saved; the server already removed the new images.
      if (result) showResult(result);
    } catch (error) {
      // redirect() from the server action surfaces here as a navigation, not an error.
      if (error && typeof error === "object" && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
        throw error;
      }
      // The listing was not saved; drop images uploaded for it (the server keeps any that are in use).
      discardListingImages(uploaded);
      showToast(error instanceof UploadError ? error.message : "Xəta baş verdi, yenidən cəhd edin", "error");
      setBusy(false);
    }
  }

  function onReset() {
    setFiles([]);
    setCategoryId("");
    setSubcategoryId("");
    setSubTouched(false);
    setPrice("");
    setAccepted(false);
    setTitleError(false);
    setFieldErrors({});
  }

  const sectionTitleIcon = {
    basic: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
      </svg>
    ),
    category: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1"></rect>
      </svg>
    ),
    images: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <path d="M21 15l-5-5L5 21"></path>
      </svg>
    ),
  };

  return (
    <>
      <form ref={formRef} method="post" encType="multipart/form-data" className="post-ad-form" id="postAdForm" noValidate onSubmit={onSubmit} onReset={onReset}>
        <div className="post-ad-form__header">
          <div>
            <h2>{t(isCreate ? "post_ad_title" : "edit_ad_title")}</h2>
            {isCreate && <p>{t("post_ad_subtitle")}</p>}
          </div>
          {isCreate && (
            <button type="reset" className="post-ad-reset-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              <span>{t("reset_form_button")}</span>
            </button>
          )}
        </div>

        {serverMessages && serverMessages.length > 0 && <ValidationSummary messages={serverMessages} />}

        <section className="post-ad-section">
          <h3 className="post-ad-section__title">
            {sectionTitleIcon.basic}
            <span>{t("basic_info")}</span>
          </h3>
          <label>
            <span>{t("title_label")}</span>
            <input
              ref={titleRef}
              type="text"
              id="adTitle"
              name="Title"
              list="titleKeywords"
              autoComplete="off"
              placeholder={isCreate ? "Məs. köynək, divan, telefon..." : undefined}
              defaultValue={initial?.title}
              onBlur={validateTitle}
              onInput={() => {
                titleRef.current?.setCustomValidity("");
                setTitleError(false);
              }}
            />
            <datalist id="titleKeywords">
              {titleKeywords.map((k) => (
                <option key={k} value={k}></option>
              ))}
            </datalist>
            <FieldError messages={fieldErrors.Title} />
            <span className="post-ad-section__hint" id="titleError" style={{ color: "var(--color-danger)", display: titleError ? "block" : "none" }}>
              Yalnız siyahıdan bir söz seçin.
            </span>
          </label>
          <label>
            <span>{t("description_label")}</span>
            <textarea
              id="Description"
              name="Description"
              rows={5}
              placeholder={isCreate ? t("description_example") : undefined}
              defaultValue={initial?.description}
            ></textarea>
            <FieldError messages={fieldErrors.Description} />
          </label>
        </section>

        <section className="post-ad-section">
          <h3 className="post-ad-section__title">
            {sectionTitleIcon.category}
            <span>{t("category_price_section")}</span>
          </h3>
          <div className="post-ad-form__grid">
            <label>
              <span>{t("category_label")}</span>
              <select
                id="adCategory"
                name="CategoryId"
                value={categoryId}
                onChange={(e) => {
                  setSubTouched(true);
                  setCategoryId(e.target.value);
                  setSubcategoryId("");
                }}
              >
                <option value="">{t("select_option")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {localName(lang, c)}
                  </option>
                ))}
              </select>
              <FieldError messages={fieldErrors.CategoryId} />
            </label>
            <label>
              <span>{t("subcategory_label")}</span>
              <select
                id="adSubcategory"
                name="SubcategoryId"
                disabled={subTouched ? subcategories.length === 0 : true}
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
              >
                {subTouched ? (
                  <>
                    <option value="">{t("select_option")}</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {localName(lang, sub)}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">{t("select_category_first")}</option>
                )}
              </select>
            </label>
            <label>
              <span>{t("price_label")}</span>
              <input
                id="adPrice"
                name="Price"
                type="text"
                inputMode="decimal"
                placeholder={isCreate ? "0" : undefined}
                value={price}
                onChange={(e) => setPrice(filterPrice(e.target.value))}
              />
              <FieldError messages={fieldErrors.Price} />
              <span className="post-ad-section__hint" id="priceFeeNote">
                {feeNote(price)}
              </span>
            </label>
            <label>
              <span>{t("condition_label")}</span>
              <select id="Condition" name="Condition" defaultValue={initial?.condition === "new" ? "new" : "used"}>
                <option value="new">{t("condition_new")}</option>
                <option value="used">{t("condition_used")}</option>
              </select>
            </label>
            <label className="post-ad-form__full">
              <span>{t("location_label")}</span>
              <input
                type="text"
                id="Location"
                name="Location"
                list="azRegions"
                autoComplete="off"
                placeholder={isCreate ? t("location_example") : undefined}
                defaultValue={initial?.location ?? ""}
              />
              <AzRegionsDatalist />
            </label>
          </div>
        </section>

        <section className="post-ad-section">
          <h3 className="post-ad-section__title">
            {sectionTitleIcon.images}
            <span>{t("images_label")}</span>
            <span className="post-ad-section__hint">(maksimum {MAX_IMAGES} ədəd)</span>
          </h3>
          {initial && initial.existingImages.length > 0 && (
            <>
              <p className="post-ad-section__hint">Hazırkı şəkillər (yeni şəkil yükləsəniz, admin təsdiqindən sonra bunların yerinə keçəcək):</p>
              <div className="post-ad-previews">
                {initial.existingImages.map((img, i) => (
                  <div key={i} className="post-ad-preview">
                    <img src={img} alt={initial.title} />
                  </div>
                ))}
              </div>
            </>
          )}
          <div
            className={`post-ad-dropzone${dragover ? " dragover" : ""}`}
            id="dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragover(true);
            }}
            onDragLeave={() => setDragover(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragover(false);
              addFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")));
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p>
              <span>{t("drag_drop_text")}</span> <span className="post-ad-dropzone__link">{t("click_to_select")}</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              id="adImages"
              name="ImageFiles"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </div>
          <div className="post-ad-previews" id="imagePreviews">
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

        {isCreate && (
          <label className="post-ad-form__checkbox">
            <input
              type="checkbox"
              id="AcceptTerms"
              name="AcceptTerms"
              value="true"
              checked={accepted}
              onClick={(e) => {
                e.preventDefault();
                setTermsOpen(true);
              }}
              onChange={() => {}}
            />
            <span>
              <span>{t("accept_terms")}</span> <span>{t("terms_link")}</span> <span>{t("accept_terms_end")}</span>
            </span>
          </label>
        )}

        <button type="submit" disabled={busy}>
          {t(isCreate ? "submit_ad_button" : "save_button")}
        </button>
      </form>

      {isCreate && (
        <div
          id="termsModalOverlay"
          className={`terms-modal-overlay${termsOpen ? "" : " hidden"}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setTermsOpen(false);
          }}
        >
          <div className="terms-modal">
            <h3>{t("legal_adterms_title")}</h3>
            <div className="terms-modal__body">
              <p>{t("legal_adterms_text")}</p>
            </div>
            <button
              type="button"
              id="acceptTermsBtn"
              className="post-ad-btn post-ad-btn--filled"
              onClick={() => {
                setAccepted(true);
                setTermsOpen(false);
              }}
            >
              {t("accept_terms_end")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
