import { APP_DOMAIN } from "../lib/siteUrl";

interface Props {
  value: string;
  onChange: (slug: string, error: string) => void;
  error?: string;
}

/**
 * The "https:// [slug] .chasqr.com" field shared by every site-creation page.
 * Owns the slug rules (lowercase, 3–50 chars, letters/numbers/hyphens) so they
 * can't drift between the upload, build and import flows.
 */
export default function SlugInput({ value, onChange, error }: Props) {
  const handleChange = (raw: string) => {
    const cleaned = raw.toLowerCase().replace(/[^a-z0-9-]/g, "");
    let err = "";
    if (cleaned && cleaned.length < 3) err = "At least 3 characters";
    else if (cleaned.length > 50) err = "50 characters max";
    onChange(cleaned, err);
  };

  const previewSlug = value || "(auto-generated)";

  return (
    <div className="mb-8">
      <label className="text-sm font-medium text-slate-700 block mb-1.5">
        Custom URL{" "}
        <span className="text-slate-400 font-normal">(optional)</span>
      </label>
      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
        <span className="bg-slate-50 text-slate-400 text-sm px-4 py-3 border-r border-slate-200 whitespace-nowrap shrink-0">
          https://
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="my-project"
          maxLength={50}
          className="flex-1 px-3 py-3 text-sm focus:outline-none bg-white min-w-0"
        />
        <span className="bg-slate-50 text-slate-400 text-sm px-4 py-3 border-l border-slate-200 whitespace-nowrap shrink-0">
          .{APP_DOMAIN}
        </span>
      </div>
      {error ? (
        <p className="text-xs text-red-500 mt-1.5">{error}</p>
      ) : (
        <p className="text-xs text-slate-400 mt-1.5">
          Your site will be at{" "}
          <span className="font-mono text-primary">
            https://{previewSlug}.{APP_DOMAIN}
          </span>{" "}
          — lowercase letters, numbers, and hyphens only
        </p>
      )}
    </div>
  );
}
