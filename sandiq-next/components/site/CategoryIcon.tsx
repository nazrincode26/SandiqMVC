/** Views/Shared/_CategoryIcon.cshtml — icon chosen by the category's AZ name. */
export default function CategoryIcon({ name }: { name: string }) {
  const key = (name ?? "").trim().toLowerCase();
  const common = {
    className: "category-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (key === "geyim") {
    return (
      <svg {...common}>
        <path d="M9 3 4 7v4h3v10h10V11h3V7l-5-4-2 2h-2z" />
      </svg>
    );
  }
  if (key === "qab-qacaq") {
    return (
      <svg {...common}>
        <path d="M5 11h14v6a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z" />
        <path d="M2 10h3v3H2z" />
        <path d="M19 10h3v3h-3z" />
        <line x1="12" y1="7" x2="12" y2="9" />
        <circle cx="12" cy="5.6" r="1.1" />
      </svg>
    );
  }
  if (key === "yeməklər") {
    return (
      <svg {...common}>
        <line x1="8" y1="3" x2="8" y2="9" />
        <line x1="11" y1="3" x2="11" y2="9" />
        <line x1="14" y1="3" x2="14" y2="9" />
        <path d="M8 9c0 3 1.5 3 3 3s3 0 3-3" />
        <line x1="11" y1="12" x2="11" y2="21" />
        <path d="M19 3c2 2 2 5 0 8v10" />
      </svg>
    );
  }
  if (key === "əl işləri") {
    return (
      <svg {...common}>
        <circle cx="7.5" cy="6" r="1.6" />
        <line x1="9" y1="7.5" x2="21" y2="19" />
        <path d="M6 8c-3 1-3 4-1 5s1 4-2 5" />
      </svg>
    );
  }
  if (key === "digər") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  // "əşyalar" and the default share the bag icon.
  return (
    <svg {...common}>
      <path d="M6 9h12l1 12H5z" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
