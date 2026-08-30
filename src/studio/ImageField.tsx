import { useRef } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { useAssetUpload } from "./upload";

const inputCls =
  "h-8 shrink-0 rounded-lg border border-slate-200 px-2 text-[12.5px] outline-none focus:border-primary";

function UploadButton({
  onFiles,
  busy,
  multiple,
  title,
}: {
  onFiles: (files: FileList) => void;
  busy: boolean;
  multiple?: boolean;
  title: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        title={title}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          // Cleared so picking the same file twice in a row still fires change.
          e.target.value = "";
        }}
      />
    </>
  );
}

/**
 * A URL box with an upload button beside it.
 *
 * Both routes stay open on purpose: pasting a URL is faster when the image is
 * already hosted, and uploading is the only option when it is sitting on the
 * user's desktop. An upload simply writes its returned path into the same
 * field, so there is one value to reason about either way.
 */
export function ImageField({
  siteId,
  value,
  onChange,
  placeholder = "Image URL",
  width = "w-52",
}: {
  siteId?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: string;
}) {
  const { upload, busy, error } = useAssetUpload(siteId);

  return (
    <span className="flex shrink-0 items-center gap-1">
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        title={error || undefined}
        className={`${inputCls} ${width} ${error ? "border-red-300" : ""}`}
      />
      <UploadButton
        busy={busy}
        title="Upload an image from your computer"
        onFiles={async (files) => {
          const [path] = await upload(files);
          if (path) onChange(path);
        }}
      />
    </span>
  );
}
