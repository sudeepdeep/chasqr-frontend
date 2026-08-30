import BlockPreview from "./BlockPreview";

/**
 * Live render of the whole page, below the editor.
 *
 * The editor above shows structure — which sections exist, what is in them,
 * what is selected. This shows the result: padding, background, column widths
 * and alignment applied exactly as set, so a change to Padding Y is visible
 * here the moment the slider moves rather than after a deploy.
 *
 * An approximation of layoutRenderer.service, not a second implementation of
 * it. It covers the properties you can actually change from the inspector;
 * Preview site remains the source of truth for exact published output.
 */

const VALIGN: Record<string, string> = {
  top: "flex-start",
  center: "center",
  bottom: "flex-end",
  stretch: "stretch",
};

function sectionStyle(sec: any): React.CSSProperties {
  const s: React.CSSProperties = { position: "relative" };

  if (sec.shader) {
    s.background =
      "radial-gradient(120% 100% at 30% 20%, #60a5fa 0%, #2563eb 45%, #020617 100%)";
    s.color = "#fff";
  } else if (sec.bgImage) {
    const ov = sec.overlay || "rgba(15,23,42,0.55)";
    s.backgroundImage = `linear-gradient(${ov}, ${ov}), url(${sec.bgImage})`;
    s.backgroundSize = "cover";
    s.backgroundPosition = "center";
    s.color = "#fff";
  } else if (sec.glass) {
    s.background = "rgba(148,163,184,0.18)";
    s.backdropFilter = "blur(14px)";
  } else if (sec.bg) {
    s.background = sec.bg;
  }

  if (sec.radius) s.borderRadius = sec.radius;
  if (sec.shadow) s.boxShadow = "0 18px 40px -18px rgba(15,23,42,.35)";
  if (sec.minH) s.minHeight = sec.minH;
  if (sec.padY != null) {
    s.paddingTop = sec.padY;
    s.paddingBottom = sec.padY;
  }
  if (sec.padX != null) {
    s.paddingLeft = sec.padX;
    s.paddingRight = sec.padX;
  }
  if (sec.mt) s.marginTop = sec.mt;
  if (sec.mb) s.marginBottom = sec.mb;
  if (sec.borderW)
    s.border = `${sec.borderW}px solid ${sec.borderColor || "#e5e7eb"}`;
  if (sec.font) s.fontFamily = sec.font;
  // A custom width narrows the section itself, matching the renderer.
  if (sec.widthPct) {
    s.maxWidth = `${sec.widthPct}%`;
    s.marginLeft = sec.ml ?? "auto";
    s.marginRight = sec.mr ?? "auto";
  }
  return s;
}

function columnStyle(col: any, span: number): React.CSSProperties {
  const s: React.CSSProperties = { gridColumn: `span ${span}` };
  if (col.bg) s.background = col.bg;
  if (col.pad != null) s.padding = col.pad;
  if (col.radius) s.borderRadius = col.radius;
  if (col.shadow) s.boxShadow = "0 10px 24px -14px rgba(15,23,42,.3)";
  if (col.borderW)
    s.border = `${col.borderW}px solid ${col.borderColor || "#e5e7eb"}`;
  if (col.minH) s.minHeight = col.minH;
  if (col.align) s.textAlign = col.align as any;
  if (col.cardImg) {
    const ov = col.overlay || "rgba(15,23,42,0.45)";
    s.backgroundImage = `linear-gradient(${ov}, ${ov}), url(${col.cardImg})`;
    s.backgroundSize = "cover";
    s.backgroundPosition = "center";
    s.color = "#fff";
  }
  return s;
}

export default function LivePreview({
  sections,
  layoutStyle,
  nav,
  footer,
  device,
}: {
  sections: any[];
  layoutStyle?: any;
  nav?: any;
  footer?: any;
  device: "desktop" | "mobile";
}) {
  const page: React.CSSProperties = {
    background: layoutStyle?.bg || "#ffffff",
    fontFamily: layoutStyle?.font || undefined,
    paddingTop: layoutStyle?.padY || undefined,
    paddingBottom: layoutStyle?.padY || undefined,
  };

  const body = (
    <div style={page} className="min-h-full">
      {nav?.enabled && (
        <div
          style={{ background: nav.bg || "#0f172a", color: nav.color || "#e2e8f0" }}
          className="flex items-center gap-4 px-4 py-3"
        >
          <span className="text-[13px] font-bold">{nav.brand || "Brand"}</span>
          <span className="flex flex-wrap gap-3">
            {(nav.links || []).map((l: any) => (
              <span key={l.id} className="text-[12px] opacity-80">
                {l.label}
              </span>
            ))}
          </span>
        </div>
      )}

      {sections.map((sec) => (
        <section key={sec.id} style={sectionStyle(sec)}>
          <div
            style={{
              maxWidth: sec.full ? "none" : 1100,
              margin: "0 auto",
              paddingLeft: layoutStyle?.padX ?? 0,
              paddingRight: layoutStyle?.padX ?? 0,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: 20,
                alignItems: VALIGN[sec.vAlign] || "start",
                // A hero with a min-height centres its content, which is what
                // makes the difference between a banner and a tall empty box.
                minHeight: sec.minH ? sec.minH - (sec.padY ?? 0) * 2 : undefined,
              }}
            >
              {(sec.columns || []).map((col: any) => (
                <div
                  key={col.id}
                  style={columnStyle(col, Math.min(12, Math.max(1, col.span || 12)))}
                >
                  <div className="flex flex-col gap-3">
                    {(col.blocks || []).map((b: any) => (
                      <BlockPreview key={b.id} block={b} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {footer?.enabled && (
        <div
          style={{ background: footer.bg || "#0f172a", color: footer.color || "#94a3b8" }}
          className="px-4 py-6 text-center text-[12px]"
        >
          {footer.text || "© Your site"}
        </div>
      )}

      {sections.length === 0 && !nav?.enabled && !footer?.enabled && (
        <div className="flex h-40 items-center justify-center text-[12.5px] text-slate-400">
          Nothing to preview yet — add a section above.
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-auto bg-slate-100 p-4">
      {device === "mobile" ? (
        // A real phone width, not a scaled-down page: text wraps and columns
        // stack the way they actually will, which is the point of checking.
        <div className="mx-auto w-[390px] overflow-hidden rounded-[18px] border-[6px] border-slate-800 bg-white shadow-xl">
          {body}
        </div>
      ) : (
        <div className="mx-auto max-w-[1100px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {body}
        </div>
      )}
    </div>
  );
}
