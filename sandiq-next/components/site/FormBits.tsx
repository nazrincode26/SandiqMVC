import { Fragment } from "react";

/** asp-validation-summary="All" */
export function ValidationSummary({ messages, className = "text-danger" }: { messages: string[]; className?: string }) {
  if (!messages.length) return <div className={`${className} validation-summary-valid`}></div>;
  return (
    <div className={`${className} validation-summary-errors`}>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

/** asp-validation-for */
export function FieldError({ messages, className = "text-danger" }: { messages?: string[]; className?: string }) {
  if (!messages?.length) return <span className={`${className} field-validation-valid`}></span>;
  return <span className={`${className} field-validation-error`}>{messages[0]}</span>;
}

/** Views/Shared/_StarRatingInput.cshtml */
export function StarRatingInput({ idPrefix, inputName }: { idPrefix: string; inputName: string }) {
  return (
    <div className="star-rating-input">
      {[5, 4, 3, 2, 1].map((i) => (
        <Fragment key={i}>
          <input type="radio" id={`${idPrefix}_${i}`} name={inputName} value={i} required />
          <label htmlFor={`${idPrefix}_${i}`}>★</label>
        </Fragment>
      ))}
    </div>
  );
}

/** Views/Shared/_AzRegionsDatalist.cshtml */
export const AZ_REGIONS = [
  "Bakı", "Gəncə", "Sumqayıt", "Mingəçevir", "Naftalan", "Şirvan", "Yevlax", "Xankəndi", "Şuşa",
  "Abşeron", "Ağcabədi", "Ağdam", "Ağdaş", "Ağstafa", "Ağsu", "Astara", "Balakən", "Beyləqan",
  "Bərdə", "Biləsuvar", "Cəbrayıl", "Cəlilabad", "Daşkəsən", "Füzuli", "Gədəbəy", "Goranboy",
  "Göyçay", "Göygöl", "Hacıqabul", "Xaçmaz", "Xızı", "Xocalı", "Xocavənd", "İmişli", "İsmayıllı",
  "Kəlbəcər", "Kürdəmir", "Qax", "Qazax", "Qəbələ", "Qobustan", "Quba", "Qubadlı", "Qusar",
  "Laçın", "Lənkəran", "Lerik", "Masallı", "Neftçala", "Oğuz", "Saatlı", "Sabirabad", "Salyan",
  "Samux", "Siyəzən", "Şabran", "Şamaxı", "Şəki", "Şəmkir", "Tərtər", "Tovuz", "Ucar",
  "Yardımlı", "Zaqatala", "Zərdab",
];

export function AzRegionsDatalist() {
  return (
    <datalist id="azRegions">
      {AZ_REGIONS.map((r) => (
        <option key={r} value={r}></option>
      ))}
    </datalist>
  );
}
