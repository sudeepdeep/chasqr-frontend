import { useEffect, useRef } from "react";
import { fragmentShaderGLSL, vertexShaderGLSL } from "./ui/velaris";

/** Palette for each named preset. Must match SHADERS in layoutRenderer.service. */
const PRESETS: Record<string, { bg: string; colors: string[] }> = {
  aurora: {
    bg: "#020617",
    colors: ["#60a5fa", "#2563eb", "#1d4ed8", "#020617"],
  },
};

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
};

/**
 * The animated banner background, as seen inside the builder.
 *
 * The deployed page runs a hand-written WebGL script emitted by the backend
 * renderer — a static site has no React. This exists so the editor shows the
 * same thing the visitor will get, and it imports the shader source from
 * velaris.tsx so at least the frontend has one copy of the GLSL.
 *
 * Fails quietly: with no WebGL the canvas simply stays transparent and the
 * gradient underneath it shows through, exactly as on a deployed site.
 */
export default function ShaderCanvas({
  preset = "aurora",
  className = "",
}: {
  preset?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };

    const vs = compile(gl.VERTEX_SHADER, vertexShaderGLSL);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentShaderGLSL);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const locs = {
      res: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      grain: gl.getUniformLocation(program, "u_grain"),
      colors: gl.getUniformLocation(program, "u_colors"),
      bg: gl.getUniformLocation(program, "u_bg"),
    };

    const conf = PRESETS[preset] ?? PRESETS.aurora;
    // Hoisted out of the frame loop — re-parsing hex 60 times a second is pure
    // waste, and the palette never changes while mounted.
    const flat = new Float32Array(conf.colors.flatMap(hexToRgb));
    const bg = hexToRgb(conf.bg);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = Math.max(1, Math.round(host.clientWidth * dpr));
      const h = Math.max(1, Math.round(host.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (t: number) => {
      resize();
      gl.uniform2f(locs.res, canvas.width, canvas.height);
      gl.uniform1f(locs.time, t * 0.001 * 1.2);
      gl.uniform1f(locs.grain, 0.25);
      gl.uniform3fv(locs.colors, flat);
      gl.uniform3f(locs.bg, bg[0], bg[1], bg[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    if (still) {
      draw(0);
      return () => ro.disconnect();
    }

    let raf = requestAnimationFrame(function loop(t) {
      draw(t);
      raf = requestAnimationFrame(loop);
    });

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      // Editors mount and unmount sections constantly while someone builds a
      // page. Browsers cap live WebGL contexts (~16), so an unreleased one per
      // preview would eventually stop new banners from rendering at all.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [preset]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
