import { useCallback, useState } from "react";
import { uploadAssetAPI } from "../api/site.api";

/** Matches the 5MB limit the asset endpoint enforces, so the check happens here first. */
export const MAX_ASSET_BYTES = 5 * 1024 * 1024;

/**
 * Uploads images into the site's own asset store.
 *
 * The endpoint returns a site-relative path such as `assets/1712-photo.jpg`,
 * which is what gets stored on the element — not a blob or data URL. Anything
 * else would either die with the browser session or bloat the saved page, and
 * the renderer already accepts relative paths as valid image sources.
 *
 * Files upload one at a time rather than in parallel: the endpoint takes a
 * single file, and a dozen simultaneous requests from one picker is a good way
 * to make a small server unhappy for no gain in wall-clock time.
 */
export function useAssetUpload(siteId?: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (files: FileList | File[]): Promise<string[]> => {
      const list = Array.from(files);
      if (!siteId || !list.length) return [];

      const tooBig = list.find((f) => f.size > MAX_ASSET_BYTES);
      if (tooBig) {
        setError(`${tooBig.name} is over 5MB`);
        return [];
      }
      const notImage = list.find((f) => !f.type.startsWith("image/"));
      if (notImage) {
        setError(`${notImage.name} is not an image`);
        return [];
      }

      setBusy(true);
      setError(null);
      const paths: string[] = [];
      try {
        for (const file of list) {
          const form = new FormData();
          form.append("file", file);
          const res = await uploadAssetAPI(siteId, form);
          const path = res.data?.data?.path;
          if (path) paths.push(path);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || "Upload failed");
      } finally {
        setBusy(false);
      }
      return paths;
    },
    [siteId],
  );

  return { upload, busy, error, clearError: () => setError(null) };
}
