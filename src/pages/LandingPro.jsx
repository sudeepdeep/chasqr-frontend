/**
 * Chasqr landing page — single-file React port of "Chasqr Landing.dc.html".
 * Plain React + inline styles. No dependencies beyond react / react-dom.
 *
 * The navbar is intentionally NOT included — render your own <Navbar /> above
 * <Page />. The page assumes a 72px fixed navbar (NAV_H below); change that one
 * constant if yours is a different height and every sticky offset follows.
 *
 * three.js is loaded lazily from a CDN only on >=1024px viewports (see
 * loadThree). To bundle it instead: `npm i three` and swap the two dynamic
 * import() URLs for bare specifiers.
 */
import React, {
  useCallback, useEffect, useLayoutEffect, useRef, useState,
} from 'react';

/* ------------------------------------------------------------------ tokens */

const C = {
  canvas: '#F8FAFC',
  surface: '#FFFFFF',
  ink: '#0A0F1C',
  body: '#475569',
  muted: '#94A3B8',
  line: '#E2E8F0',
  hairline: '#F1F5F9',
  brand: '#2563EB',
  brandDeep: '#1D4ED8',
  brandWash: '#EFF6FF',
  brandSoft: '#DBEAFE',
  accent: '#38BDF8',
};

const FONT = {
  display: "'Inter Tight', Inter, system-ui, sans-serif",
  body: 'Inter, system-ui, sans-serif',
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const NAV_H = 64;   // matches this app's fixed Navbar (h-16). PIN and every sticky offset derive from it.
const RAIL_H = 49;
const PIN = NAV_H + RAIL_H;   // where the chapter panel locks
const SHELL = { maxWidth: 1280, margin: '0 auto', padding: '0 24px' };
const MODEL_SCALE = 2.3;      // longest GLB axis, in world units

const EYEBROW = {
  fontSize: 13, fontWeight: 600, letterSpacing: '0.09em',
  textTransform: 'uppercase', color: C.brand,
};
const H2 = {
  margin: 0, fontFamily: FONT.display, fontWeight: 600,
  letterSpacing: '-0.03em', fontSize: 'clamp(1.75rem,3vw,2.25rem)', color: C.ink,
};
const LEAD = { fontSize: 17, lineHeight: 1.65, color: C.body, textWrap: 'pretty' };
const FIELD = {
  padding: '0 14px', border: `1px solid ${C.line}`, borderRadius: 8,
  background: C.canvas, fontFamily: FONT.body, fontSize: 16,
  color: C.ink, outline: 'none', transition: 'border-color 150ms linear',
};

/* ------------------------------------------------------------------- data */

const ROTATOR = [
  'free hosting', 'SSL', 'custom domains', 'custom builds',
  'SEO tools', 'visitor analytics', 'form handling',
];

const CHAPTERS = [
  {
    tab: 'Deploy', num: '01', kicker: 'Ship', title: 'Push. It\u2019s live.',
    lead: 'Connect a GitHub repository once and every push redeploys automatically.',
    url: 'app.chasqr.io/deploys', slot: 'chapter-01-ship', label: '01 Ship',
    points: [
      'Import a repo in under a minute',
      'Auto-deploy on every push',
      'A failed build never takes your site down',
    ],
  },
  {
    tab: 'Builder', num: '02', kicker: 'Build', title: 'Or build it without code.',
    lead: 'Drag in sections, columns, navbars and footers.',
    url: 'app.chasqr.io/builder', slot: 'chapter-02-build', label: '02 Build',
    points: [
      '40+ blocks and templates',
      'Edit copy and images without touching HTML',
      'Save & deploy publishes instantly',
    ],
  },
  {
    tab: 'Domains', num: '03', kicker: 'Secure', title: 'Your domain. Your HTTPS.',
    lead: 'Point a domain at Chasqr with a single A 76.76.21.21 record.',
    url: 'app.chasqr.io/domains', slot: 'chapter-03-secure', label: '03 Secure',
    points: [
      'One A record and you\u2019re done',
      'Free certificates issued and renewed automatically',
      'Free on every site including the free tier',
    ],
  },
  {
    tab: 'SEO', num: '04', kicker: 'Grow', title: 'Everything after launch.',
    lead: 'Search, traffic and forms are part of the platform, not three more subscriptions.',
    url: 'app.chasqr.io/seo', slot: 'chapter-04-grow', label: '04 Grow',
    points: [
      '20-point SEO audit with automatic fixes',
      'Visits tracked without a third-party script',
      'Form submissions stored and emailed to you',
    ],
  },
  {
    tab: 'Analytics', num: '05', kicker: 'Measure', title: 'See who\u2019s actually visiting.',
    lead: 'Traffic for every site you run, in one panel.',
    url: 'app.chasqr.io/analytics', slot: 'chapter-05-measure', label: '05 Measure',
    points: [
      'Visits per day across all sites',
      'Visitors by country',
      'No third-party tracker, no cookie banner',
    ],
  },
];

const STEPS = [
  { num: '01', title: 'Upload', body: 'Drag a folder in or connect a repository.' },
  { num: '02', title: 'Share', body: 'Your site is live on a URL you can send straight away.' },
  { num: '03', title: 'Iterate', body: 'Edit, redeploy, and watch the change go out in seconds.' },
];

const TRUST = [
  'Razorpay & Cashfree payments',
  'Free SSL on every domain',
  'Real expert support',
  '2FA account protection',
];

const FEATURES = [
  ['Instant Deploy', 'Push or upload and the build goes out immediately.'],
  ['Custom Domains + Free SSL', 'One A record; certificates issued and renewed for you.'],
  ['Live Content Editor', 'Change copy and images in the browser, no HTML.'],
  ['Colour Editor', 'Recolour a whole site from one palette.'],
  ['SEO Manager', 'A 20-point audit with fixes you can apply in place.'],
  ['Preview Before Publish', 'See the built site on a preview URL first.'],
  ['Visit Analytics', 'Visits and countries, no third-party script.'],
  ['One-Click Redeploys', 'Roll a build forward or back from the dashboard.'],
];

const COMPARE_COLS = ['Chasqr', 'Typical static host', 'Your own server'];
const COMPARE_ROWS = [
  ['Deploy from a Git push', 'Built in', 'Built in', 'A pipeline you maintain'],
  ['Upload a folder instead', 'Yes', 'Sometimes', 'Manual copy'],
  ['Visual builder for non-developers', 'Included', 'No', 'No'],
  ['Custom domain with SSL', 'One A record, cert included', 'Included', 'You issue and renew it'],
  ['Visit analytics', 'Included', 'Third-party script', 'Self-hosted'],
  ['Form submissions', 'Stored and emailed', 'Add-on', 'You build it'],
  ['Roll back to an earlier build', 'One click', 'Varies', 'Manual'],
];

const FAQS = [
  ['Do I need to know Git?',
   'No. Drag a folder in, or build the site in the visual builder. Connecting a repository is one option, not a requirement.'],
  ['What happens if a build fails?',
   'The build that is already live stays live. A failed build never takes your site down, and you can roll back to any earlier build in one click.'],
  ['How do I point my domain at it?',
   'One A 76.76.21.21 record. The certificate is issued and renewed automatically, on every plan.'],
  ['Do you keep my source code?',
   'We store your build output, not your source code.'],
  ['What is included on the free tier?',
   'Deploys, custom domains, free SSL, the visual builder, the SEO manager, analytics and form handling. Free to start, free to keep.'],
  ['How do payments work?',
   'Through Razorpay and Cashfree, with 2FA available on your account.'],
];

/* ------------------------------------------------------------------ hooks */

function useMediaQuery(query) {
  const [match, setMatch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

const useDesktop = () => useMediaQuery('(min-width: 1024px)');
const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

/** Read scroll position on a rAF-throttled listener. */
function useScrollTick(onTick) {
  const cb = useRef(onTick);
  cb.current = onTick;
  useEffect(() => {
    let queued = false;
    const run = () => {
      queued = false;
      cb.current();
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
}

/** Fire-once enter animation: 20px rise, 600ms, optional delay. */
function useReveal(delay = 0) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (reduced) { setShown(true); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        setShown(true);
        io.unobserve(e.target);
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -18% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);
  const style = reduced ? undefined : {
    opacity: shown ? 1 : 0,
    transform: shown ? 'none' : 'translateY(20px)',
    transition: `opacity 600ms ${EASE}, transform 600ms ${EASE}`,
    transitionDelay: `${delay}ms`,
  };
  return [ref, style];
}

/** <Reveal> wrapper for the common case. */
function Reveal({ delay = 0, as: Tag = 'div', style, children, ...rest }) {
  const [ref, revealStyle] = useReveal(delay);
  return (
    <Tag ref={ref} style={{ ...style, ...revealStyle }} {...rest}>
      {children}
    </Tag>
  );
}

/* --------------------------------------------------------- 3D hero object */

let threePromise = null;
/** Loaded once per page, only when a desktop viewport asks for it. */
function loadThree() {
  if (!threePromise) {
    threePromise = (async () => {
      const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
        import('three'),
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/environments/RoomEnvironment.js'),
      ]);
      return { THREE, GLTFLoader, RoomEnvironment };
    })();
  }
  return threePromise;
}

/**
 * The live logo. Studio environment, one soft key upper-left, neutral fill,
 * transparent canvas, shadow-catcher plane. Resting pose 18deg Y / 12deg X;
 * scroll through the first viewport eases Y to 4deg and lifts it 40px.
 * Reduced motion holds the resting pose and ignores scroll.
 */
function LogoCanvas({ modelUrl = '/chasqr-logo.glb' }) {
  const canvasRef = useRef(null);
  const progress = useRef(0);
  const reduced = useReducedMotion();

  useScrollTick(() => {
    progress.current = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)));
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let stop = false;
    let cleanup = () => {};

    loadThree().then(({ THREE, GLTFLoader, RoomEnvironment }) => {
      if (stop) return;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
      camera.position.set(0, 0.55, 6.4);
      camera.lookAt(0, 0, 0);

      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.5;

      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(-4.2, 5.2, 4);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.radius = 4;
      key.shadow.bias = -0.0006;
      Object.assign(key.shadow.camera, {
        left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20,
      });
      key.shadow.camera.updateProjectionMatrix();
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xffffff, 0.4);
      fill.position.set(3.5, 1.2, 3);
      scene.add(fill);
      scene.add(new THREE.AmbientLight(0xffffff, 0.25));

      // Contact shadow only — the plane itself is invisible.
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(24, 24),
        new THREE.ShadowMaterial({ color: 0x0a0f1c, opacity: 0.2 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1.62;
      ground.receiveShadow = true;
      scene.add(ground);

      const group = new THREE.Group();
      group.rotation.set(
        THREE.MathUtils.degToRad(12),
        THREE.MathUtils.degToRad(18),
        0,
      );
      scene.add(group);

      let dirty = true;
      let pxToWorld = 0.005;

      new GLTFLoader().load(modelUrl, (gltf) => {
        const model = gltf.scene;
        model.traverse((o) => {
          if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
        });
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const s = MODEL_SCALE / Math.max(size.x, size.y, size.z || 1);
        model.scale.setScalar(s);
        model.position.sub(box.getCenter(new THREE.Vector3()).multiplyScalar(s));
        group.add(model);
        ground.position.y = new THREE.Box3().setFromObject(group).min.y - 0.06;
        dirty = true;
      });

      const resize = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const visible = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
        pxToWorld = visible / h;
        dirty = true;
      };
      resize();
      window.addEventListener('resize', resize);

      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        const p = reduced ? 0 : progress.current;
        const targetY = THREE.MathUtils.degToRad(18 + (4 - 18) * p);
        const targetLift = pxToWorld * 40 * p;
        const nextY = group.rotation.y + (targetY - group.rotation.y) * 0.12;
        const nextLift = group.position.y + (targetLift - group.position.y) * 0.12;
        if (Math.abs(nextY - group.rotation.y) > 1e-5
          || Math.abs(nextLift - group.position.y) > 1e-5) {
          group.rotation.y = nextY;
          group.position.y = nextLift;
          dirty = true;
        }
        if (dirty) { dirty = false; renderer.render(scene, camera); }
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        pmrem.dispose();
        renderer.dispose();
      };
    }).catch((err) => console.error('chasqr 3D failed', err));

    return () => { stop = true; cleanup(); };
  }, [modelUrl, reduced]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="The Chasqr icon, rendered in three dimensions"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

/* ------------------------------------------------------------------- hero */

function WordRotator({ intervalMs = 2600 }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [inView, setInView] = useState(true);
  const [width, setWidth] = useState('auto');
  const wordRef = useRef(null);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setInView(false);
      setTimeout(() => {
        setI((n) => (n + 1) % ROTATOR.length);
        setInView(true);
      }, 240);
    }, Math.max(1200, intervalMs));
    return () => clearInterval(id);
  }, [reduced, intervalMs]);

  useLayoutEffect(() => {
    const el = wordRef.current;
    if (el) setWidth(`${Math.ceil(el.getBoundingClientRect().width) + 2}px`);
  }, [i]);

  return (
    <div style={{ height: 22, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{
        display: 'inline-block', width, overflow: 'hidden',
        transition: `width 400ms ${EASE}`, verticalAlign: 'top',
      }}
      >
        <span
          ref={wordRef}
          style={{
            ...EYEBROW,
            display: 'inline-block',
            whiteSpace: 'nowrap',
            opacity: inView ? 1 : 0,
            transform: `translateY(${inView ? 0 : 8}px)`,
            transition: `opacity 400ms ${EASE}, transform 400ms ${EASE}`,
          }}
        >
          {ROTATOR[i]}
        </span>
      </div>
    </div>
  );
}

function Button({ variant = 'primary', style, children, ...rest }) {
  const [hover, setHover] = useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', height: 46, padding: '0 22px',
    borderRadius: 8, fontFamily: FONT.body, fontSize: 16, fontWeight: 600,
    whiteSpace: 'nowrap', textDecoration: 'none', cursor: 'pointer', border: 0,
    transition: 'background 150ms linear, border-color 150ms linear',
  };
  const skin = variant === 'primary'
    ? { background: hover ? C.brandDeep : C.brand, color: C.surface }
    : {
      background: C.surface, color: C.ink,
      border: `1px solid ${hover ? C.brand : C.line}`, padding: '0 20px',
    };
  return (
    <a
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...skin, ...style }}
      {...rest}
    >
      {children}
    </a>
  );
}

function Hero({ desktop, modelUrl, staticLogoSrc }) {
  return (
    <section id="top" style={{ padding: `${NAV_H + 96}px 24px 128px` }}>
      <div style={{
        ...SHELL,
        display: 'grid',
        gridTemplateColumns: desktop ? '1fr 0.72fr' : '1fr',
        gap: 48,
        alignItems: 'center',
      }}
      >
        <div>
          <Reveal><WordRotator /></Reveal>
          <Reveal
            as="h1"
            delay={60}
            style={{
              margin: 0, fontFamily: FONT.display, fontWeight: 600,
              letterSpacing: '-0.03em', lineHeight: 1.05,
              fontSize: 'clamp(2.75rem,6vw,4.5rem)', color: C.ink,
              textWrap: 'balance',
            }}
          >
            Your website, live in seconds.
          </Reveal>
          <Reveal as="p" delay={120} style={{ ...LEAD, margin: '28px 0 0', maxWidth: '68ch' }}>
            Push to GitHub, upload a folder, or build it visually. Your site goes live
            on a URL straight away — no servers, no pipelines, no monthly bill.
          </Reveal>
          <Reveal delay={180} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 36 }}>
            <Button href="#contact">Get started free</Button>
            <Button href="#chapters" variant="secondary">Read the docs</Button>
          </Reveal>
          <Reveal as="p" delay={240} style={{ margin: '16px 0 0', fontSize: 14, color: C.body }}>
            No credit card required.
          </Reveal>

          {/* Below 1024px: static export, no three.js. */}
          {!desktop && (
            <Reveal delay={300} style={{ marginTop: 48 }}>
              <img
                src={staticLogoSrc}
                alt="The Chasqr icon"
                width={220}
                height={220}
                style={{ display: 'block', width: 220, height: 220, objectFit: 'contain' }}
              />
            </Reveal>
          )}
        </div>

        {desktop && (
          <div style={{ position: 'relative', aspectRatio: '1 / 1' }}>
            <LogoCanvas modelUrl={modelUrl} />
          </div>
        )}
      </div>
    </section>
  );
}

/* --------------------------------------------------- chapters + tab rail */

function BrowserFrame({ url, children }) {
  return (
    <div style={{
      border: `1px solid ${C.line}`, borderRadius: 12,
      background: C.surface, overflow: 'hidden',
    }}
    >
      <div style={{
        height: 36, borderBottom: `1px solid ${C.line}`, display: 'flex',
        alignItems: 'center', gap: 14, padding: '0 14px',
      }}
      >
        <span style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: C.line }} />
          ))}
        </span>
        <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.muted }}>{url}</span>
      </div>
      {/* 2:1, not the hand-off's 16:10. Every product screenshot we have is
          ~2.05 wide, so a 16:10 frame with object-fit:cover was slicing 22% off
          the sides of each one. Matching the frame to the source means cover
          now trims ~3% and the shot fills the frame completely. */}
      <div style={{ aspectRatio: '2 / 1', position: 'relative' }}>{children}</div>
    </div>
  );
}

function Tick({ index, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Chapter ${index + 1}`}
      style={{
        position: 'absolute', left: -6, top: `${index * 25}%`, width: 13, height: 13,
        marginTop: -6, padding: 0, border: 0, borderRadius: '50%',
        background: 'none', cursor: 'pointer',
      }}
    >
      <span style={{
        display: 'block', width: 5, height: 5, margin: 4, borderRadius: '50%',
        background: active ? C.brand : C.line,
      }}
      />
    </button>
  );
}

function CheckList({ points, shown }) {
  return (
    <ul style={{ listStyle: 'none', margin: '28px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {points.map((p, i) => (
        <li
          key={p}
          style={{
            display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 16,
            lineHeight: 1.5, color: C.ink,
            opacity: shown ? 1 : 0,
            transform: `translateY(${shown ? 0 : 24}px)`,
            transition: `opacity 500ms ${EASE} ${70 * (i + 1)}ms, transform 500ms ${EASE} ${70 * (i + 1)}ms`,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ flex: 'none', marginTop: 3 }}>
            <path d="M2.5 8.6 6 12l7.5-8" fill="none" stroke={C.accent} strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          {p}
        </li>
      ))}
    </ul>
  );
}

/**
 * Desktop: the section is 500vh tall, the panel pins under the tab rail, and
 * scroll progress swaps one chapter for the next. Mobile: plain stacked flow.
 */
function Chapters({ desktop, active, wrapRef, scrollHeightVh, onJump }) {
  const progress = desktop ? (active / 4) * 100 : 0;

  return (
    <section
      id="chapters"
      ref={wrapRef}
      aria-label="How Chasqr works"
      style={{
        height: desktop ? `${scrollHeightVh}vh` : 'auto',
        position: 'relative',
        paddingTop: desktop ? 0 : 96,
      }}
    >
      <div style={{
        position: desktop ? 'sticky' : 'static',
        top: desktop ? PIN : 0,
        height: desktop ? `calc(100vh - ${PIN}px)` : 'auto',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
      >
        <div style={{ ...SHELL, width: '100%', position: desktop ? 'absolute' : 'relative', inset: 0 }}>
          {desktop && (
            <div
              aria-hidden={false}
              style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                width: 1, height: 280, background: C.line,
              }}
            >
              <div style={{ position: 'absolute', left: 0, top: 0, width: 1, background: C.brand, height: `${progress}%` }} />
              {CHAPTERS.map((c, i) => (
                <Tick key={c.tab} index={i} active={active >= i} onClick={() => onJump(i)} />
              ))}
            </div>
          )}

          {CHAPTERS.map((c, i) => (
            <ChapterArticle
              key={c.tab}
              chapter={c}
              index={i}
              desktop={desktop}
              active={active}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * One chapter. On desktop the pinned panel cross-fades between them, so
 * visibility follows `active`. On mobile each article reveals on its own
 * observer as it scrolls up.
 */
function ChapterArticle({ chapter: c, index: i, desktop, active }) {
  const [ref, revealStyle] = useReveal(0);
  const shown = !desktop || i === active;
  const offset = i < active ? -24 : 24;
  return (
    <article
      data-screen-label={c.label}
      ref={desktop ? undefined : ref}
      style={{
        position: desktop ? 'absolute' : 'relative',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: desktop ? '40% 60%' : '1fr',
        gap: 64,
        alignItems: 'center',
        padding: desktop ? '0 0 0 64px' : 0,
        marginBottom: desktop ? 0 : 80,
        ...(desktop ? null : revealStyle),
      }}
    >
      <div style={{
        opacity: shown ? 1 : 0,
        transform: `translateY(${shown ? 0 : offset}px)`,
        transition: `opacity 500ms ${EASE}, transform 500ms ${EASE}`,
      }}
      >
        <div style={{ fontFamily: FONT.mono, fontSize: 13, color: C.muted, letterSpacing: '0.04em' }}>{c.num}</div>
        <div style={{ ...EYEBROW, marginTop: 14 }}>{c.kicker}</div>
        <h2 style={{
          margin: '12px 0 0', fontFamily: FONT.display, fontWeight: 600,
          letterSpacing: '-0.03em', lineHeight: 1.1,
          fontSize: 'clamp(1.9rem,3.2vw,2.6rem)', color: C.ink,
        }}
        >
          {c.title}
        </h2>
        <p style={{ ...LEAD, margin: '18px 0 0', maxWidth: '52ch' }}>{c.lead}</p>
        <CheckList points={c.points} shown={shown} />
      </div>
      <div style={{
        opacity: shown ? 1 : 0,
        transform: `scale(${shown ? 1 : 1.02})`,
        transition: `opacity 500ms ${EASE}, transform 700ms ${EASE}`,
      }}
      >
        <BrowserFrame url={c.url}>
          <img
            src={`/screens/${c.slot}.png`}
            alt={`${c.kicker} — ${c.url}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </BrowserFrame>
      </div>
    </article>
  );
}

/** Sticky tab rail. Click jumps to a chapter; scrolling drives the underline. */
function CapabilityRail({ active, onJump }) {
  const railRef = useRef(null);
  const btnRefs = useRef([]);
  const [bar, setBar] = useState({ x: 0, w: 0 });
  const [overflow, setOverflow] = useState(false);
  const [hover, setHover] = useState(-1);

  const measure = useCallback(() => {
    const rail = railRef.current;
    const btn = btnRefs.current[active];
    if (!rail || !btn) return;
    setBar({ x: btn.offsetLeft, w: btn.offsetWidth });
    setOverflow(rail.scrollWidth > rail.clientWidth + 1);
  }, [active]);

  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    if (document.fonts?.ready) document.fonts.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const mask = overflow
    ? 'linear-gradient(90deg,#000 0,#000 88%,transparent 100%)'
    : 'none';

  return (
    <section
      aria-label="Capabilities"
      style={{ position: 'sticky', top: NAV_H, zIndex: 40, background: C.canvas, padding: 0 }}
    >
      <div style={SHELL}>
        <div
          ref={railRef}
          style={{
            position: 'relative', borderBottom: `1px solid ${C.line}`,
            overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none',
            WebkitMaskImage: mask, maskImage: mask,
          }}
        >
          <div
            role="tablist"
            aria-label="Jump to chapter"
            style={{ display: 'flex', gap: 20, minWidth: 'max-content', marginLeft: -8 }}
          >
            {CHAPTERS.map((c, i) => (
              <button
                key={c.tab}
                type="button"
                role="tab"
                aria-selected={i === active}
                ref={(el) => { btnRefs.current[i] = el; }}
                onClick={() => onJump(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(-1)}
                style={{
                  background: 'none', border: 0, padding: '14px 8px 16px', cursor: 'pointer',
                  fontFamily: FONT.body, fontSize: 15, fontWeight: 600,
                  letterSpacing: '-0.01em', whiteSpace: 'nowrap',
                  color: i === active || hover === i ? C.ink : C.body,
                  transition: 'color 250ms linear',
                }}
              >
                {c.tab}
              </button>
            ))}
          </div>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', bottom: 0, left: 0, height: 2, background: C.accent,
              transform: `translateX(${bar.x}px)`, width: bar.w,
              transition: `transform 250ms ${EASE}, width 250ms ${EASE}`,
            }}
          />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- lower sections */

function CtaBand() {
  return (
    <section id="cta" style={{ background: C.brand, padding: '112px 24px', marginTop: 128 }}>
      <Reveal style={{
        ...SHELL, display: 'flex', flexWrap: 'wrap', gap: 40,
        alignItems: 'flex-end', justifyContent: 'space-between',
      }}
      >
        <div>
          <h2 style={{
            margin: 0, fontFamily: FONT.display, fontWeight: 600, letterSpacing: '-0.03em',
            lineHeight: 1.05, fontSize: 'clamp(2rem,4vw,3rem)', color: C.surface,
          }}
          >
            Put it live today.
          </h2>
          <p style={{ ...LEAD, margin: '18px 0 0', maxWidth: '56ch', color: C.brandSoft }}>
            Free to start, free to keep. Bring a repo, a folder, or nothing at all.
          </p>
        </div>
        <Button
          href="#top"
          style={{ height: 48, padding: '0 24px', background: C.surface, color: C.brandDeep, flex: 'none' }}
        >
          Start Free
        </Button>
      </Reveal>
    </section>
  );
}

function Steps() {
  const reduced = useReducedMotion();
  const [drawn, setDrawn] = useState(reduced);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (reduced) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setDrawn(true); io.unobserve(e.target); } });
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section id="steps" style={{ padding: '128px 24px' }}>
      <div style={SHELL}>
        <Reveal as="h2" style={{ ...H2, marginBottom: 64 }}>Live in three steps</Reveal>
        <div ref={wrapRef} style={{ position: 'relative' }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', left: 0, right: 0, top: 6, height: 1, background: C.line,
              transform: `scaleX(${drawn ? 1 : 0})`, transformOrigin: 'left center',
              transition: 'transform 600ms linear',
            }}
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 48, paddingTop: 34,
          }}
          >
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={100 + i * 200}>
                <div style={{ fontFamily: FONT.mono, fontSize: 13, color: C.muted }}>{s.num}</div>
                <h3 style={{
                  margin: '10px 0 0', fontFamily: FONT.display, fontWeight: 600,
                  letterSpacing: '-0.02em', fontSize: 20, color: C.ink,
                }}
                >
                  {s.title}
                </h3>
                <p style={{ margin: '10px 0 0', fontSize: 16, lineHeight: 1.6, color: C.body }}>{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section aria-label="Trust" style={{ padding: '0 24px 128px' }}>
      <Reveal style={{
        ...SHELL, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`,
        padding: '22px 0', display: 'flex', flexWrap: 'wrap', gap: '10px 20px',
        fontSize: 14, color: C.body,
      }}
      >
        {TRUST.map((t, i) => (
          <React.Fragment key={t}>
            <span>{t}</span>
            {i < TRUST.length - 1 && <span aria-hidden="true" style={{ color: C.line }}>·</span>}
          </React.Fragment>
        ))}
      </Reveal>
    </section>
  );
}

function FeatureCard({ title, body, delay }) {
  const [hover, setHover] = useState(false);
  return (
    <Reveal
      delay={delay}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: `1px solid ${hover ? C.brand : C.line}`, borderRadius: 12,
        background: C.surface, padding: 24, transition: 'border-color 150ms linear',
      }}
    >
      <h3 style={{
        margin: 0, fontFamily: FONT.display, fontWeight: 600,
        letterSpacing: '-0.02em', fontSize: 17, color: C.ink,
      }}
      >
        {title}
      </h3>
      <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.6, color: C.body }}>{body}</p>
    </Reveal>
  );
}

function Features() {
  return (
    <section id="features" style={{ padding: '0 24px 128px' }}>
      <div style={SHELL}>
        <Reveal as="h2" style={{ ...H2, marginBottom: 56 }}>
          Everything included, on every plan
        </Reveal>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
        }}
        >
          {FEATURES.map(([title, body], i) => (
            <FeatureCard key={title} title={title} body={body} delay={(i % 4) * 60} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Compare() {
  const grid = { display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr' };
  return (
    <section id="compare" aria-label="How Chasqr compares" style={{ padding: '0 24px 128px' }}>
      <div style={SHELL}>
        <Reveal as="h2" style={{ ...H2, marginBottom: 16 }}>How this compares</Reveal>
        <Reveal as="p" delay={60} style={{ ...LEAD, margin: '0 0 48px', maxWidth: '62ch' }}>
          The same site, three ways to run it.
        </Reveal>
        <Reveal delay={120} style={{
          border: `1px solid ${C.line}`, borderRadius: 12,
          background: C.surface, overflowX: 'auto',
        }}
        >
          <div style={{ minWidth: 720 }}>
            <div style={{ ...grid, borderBottom: `1px solid ${C.line}` }}>
              <div style={{ ...EYEBROW, color: C.muted, padding: '18px 24px' }}>Capability</div>
              {COMPARE_COLS.map((col, i) => (
                <div
                  key={col}
                  style={{
                    padding: '18px 20px', fontFamily: FONT.display, fontSize: 16,
                    fontWeight: 600, letterSpacing: '-0.02em',
                    color: i === 0 ? C.brand : C.ink,
                  }}
                >
                  {col}
                </div>
              ))}
            </div>
            {COMPARE_ROWS.map((row, r) => (
              <div
                key={row[0]}
                style={{
                  ...grid,
                  borderBottom: r === COMPARE_ROWS.length - 1 ? 'none' : `1px solid ${C.hairline}`,
                }}
              >
                <div style={{ padding: '16px 24px', fontSize: 16, color: C.ink }}>{row[0]}</div>
                {row.slice(1).map((cell, i) => (
                  <div
                    key={`${row[0]}-${i}`}
                    style={{ padding: '16px 20px', fontSize: 15, color: i === 0 ? C.body : C.muted }}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Faq({ desktop }) {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" aria-label="Frequently asked questions" style={{ padding: '0 24px 128px' }}>
      <div style={{
        ...SHELL, display: 'grid',
        gridTemplateColumns: desktop ? '0.42fr 1fr' : '1fr', gap: 64,
      }}
      >
        <div>
          <Reveal as="h2" style={H2}>Questions</Reveal>
          <Reveal as="p" delay={60} style={{ margin: '16px 0 0', fontSize: 16, lineHeight: 1.6, color: C.body }}>
            Still unsure? The form below reaches a person.
          </Reveal>
        </div>
        <Reveal delay={120} style={{ borderTop: `1px solid ${C.line}` }}>
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q} style={{ borderBottom: `1px solid ${C.line}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 24, background: 'none',
                    border: 0, padding: '22px 0', cursor: 'pointer', textAlign: 'left',
                    fontFamily: FONT.display, fontSize: 17, fontWeight: 600,
                    letterSpacing: '-0.02em', color: C.ink,
                  }}
                >
                  {q}
                  <span
                    aria-hidden="true"
                    style={{
                      flex: 'none', width: 11, height: 11,
                      borderRight: `1.75px solid ${C.muted}`,
                      borderBottom: `1.75px solid ${C.muted}`,
                      transform: `rotate(${isOpen ? -135 : 45}deg)`,
                      transition: `transform 250ms ${EASE}`,
                    }}
                  />
                </button>
                <div style={{
                  overflow: 'hidden',
                  maxHeight: isOpen ? 220 : 0,
                  opacity: isOpen ? 1 : 0,
                  transition: `max-height 300ms ${EASE}, opacity 250ms linear`,
                }}
                >
                  <p style={{ ...LEAD, margin: '0 0 24px', fontSize: 16, maxWidth: '62ch' }}>{a}</p>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

/**
 * Contact form. Local state only — wire onSubmit to your endpoint where the
 * TODO is; everything else (validation gate, sent state, reset) already works.
 */
function Contact({ desktop, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const ready = form.name.trim() && form.email.trim() && form.message.trim();

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    try {
      // TODO: replace with your endpoint, e.g.
      // await fetch('/api/contact', { method: 'POST', body: JSON.stringify(form) });
      if (onSubmit) await onSubmit(form);
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="contact" aria-label="Contact" style={{ padding: '0 24px 128px' }}>
      <div style={{
        ...SHELL,
        border: `1px solid ${C.line}`, borderRadius: 12, background: C.surface,
        padding: desktop ? 56 : '32px 24px',
        display: 'grid', gridTemplateColumns: desktop ? '0.9fr 1fr' : '1fr',
        gap: 64, alignItems: 'start',
      }}
      >
        <Reveal>
          <h2 style={{ ...H2, lineHeight: 1.1 }}>Talk to a person</h2>
          <p style={{ ...LEAD, margin: '16px 0 0', maxWidth: '46ch' }}>
            Questions about migrating a site, a domain that will not resolve, or whether
            Chasqr fits what you are building. We answer.
          </p>
          <p style={{ margin: '24px 0 0', fontSize: 14, color: C.muted }}>
            Support is handled by the people who build the product.
          </p>
        </Reveal>

        {sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
            <span style={{
              width: 40, height: 40, borderRadius: '50%', background: C.brandWash,
              display: 'grid', placeItems: 'center',
            }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2.5 8.6 6 12l7.5-8" fill="none" stroke={C.brand} strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </span>
            <h3 style={{
              margin: 0, fontFamily: FONT.display, fontWeight: 600,
              letterSpacing: '-0.02em', fontSize: 20, color: C.ink,
            }}
            >
              Message sent
            </h3>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, maxWidth: '44ch', color: C.body }}>
              Thanks — we have it. Expect a reply at the address you gave, usually within a working day.
            </p>
            <button
              type="button"
              onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }}
              style={{
                marginTop: 4, background: 'none', border: 0, padding: 0, cursor: 'pointer',
                fontFamily: FONT.body, fontSize: 15, fontWeight: 600, color: C.brand,
              }}
            >
              Send another
            </button>
          </div>
        ) : (
          <Reveal as="form" delay={100} onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, fontWeight: 500, color: C.ink }}>
              Name
              <input type="text" name="name" autoComplete="name" placeholder="Ada Lovelace" style={{ ...FIELD, height: 44 }} {...field('name')} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, fontWeight: 500, color: C.ink }}>
              Work email
              <input type="email" name="email" autoComplete="email" placeholder="you@company.com" style={{ ...FIELD, height: 44 }} {...field('email')} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, fontWeight: 500, color: C.ink }}>
              Message
              <textarea
                name="message"
                rows={4}
                placeholder="What are you trying to put live?"
                style={{ ...FIELD, padding: '12px 14px', lineHeight: 1.5, resize: 'vertical' }}
                {...field('message')}
              />
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 6 }}>
              <button
                type="submit"
                disabled={!ready || busy}
                style={{
                  display: 'inline-flex', alignItems: 'center', height: 46, padding: '0 22px',
                  border: 0, borderRadius: 8, background: C.brand, color: C.surface,
                  fontFamily: FONT.body, fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap',
                  cursor: ready && !busy ? 'pointer' : 'not-allowed',
                  opacity: ready && !busy ? 1 : 0.5,
                  transition: 'background 150ms linear, opacity 150ms linear',
                }}
              >
                {busy ? 'Sending…' : 'Send message'}
              </button>
              <span style={{ fontSize: 14, color: C.muted }}>Usually answered within a working day.</span>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function Mark({ size = 24, radius = 7 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: radius, background: C.brand,
      display: 'grid', placeItems: 'center', flex: 'none',
    }}
    >
      <svg width={size * 0.42} height={size * 0.54} viewBox="0 0 11 14" aria-hidden="true">
        <path d="M6.2 0 0 8.1h3.7L3 14l7-8.4H6.1L6.2 0Z" fill={C.surface} />
      </svg>
    </span>
  );
}

function Footer() {
  const links = [
    ['Docs', '#chapters'], ['SEO Checker', '#features'],
    ['Contact', '#contact'], ['Terms', '#top'], ['Privacy', '#top'],
  ];
  return (
    <footer style={{ borderTop: `1px solid ${C.line}`, background: C.surface, padding: '56px 24px' }}>
      <div style={{
        ...SHELL, display: 'flex', flexWrap: 'wrap', gap: 32,
        justifyContent: 'space-between', alignItems: 'flex-start',
      }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mark />
            <span style={{
              fontFamily: FONT.display, fontWeight: 600, fontSize: 16,
              letterSpacing: '-0.03em', color: C.ink,
            }}
            >
              Chasqr
            </span>
          </div>
          <p style={{ margin: '16px 0 0', fontSize: 14, color: C.body }}>
            © 2026 — Deploy fast, iterate faster.
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: C.body }}>
            We store your build output, not your source code.
          </p>
        </div>
        <nav aria-label="Footer" style={{ display: 'flex', gap: 24, fontSize: 14, fontWeight: 500 }}>
          {links.map(([label, href]) => (
            <a key={label} href={href} style={{ color: C.body, textDecoration: 'none' }}>{label}</a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------- page */

export default function Page({
  modelUrl = '/chasqr-logo.glb',
  staticLogoSrc = '/chasqr-logo.png',
  chapterScrollVh = 500,
  onContactSubmit,
}) {
  const desktop = useDesktop();
  const reduced = useReducedMotion();
  const wrapRef = useRef(null);
  const [active, setActive] = useState(0);

  // Desktop: scroll position inside the pinned block picks the chapter.
  // Mobile: whichever chapter sits nearest 40% of the viewport.
  useScrollTick(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (desktop) {
      const total = wrap.offsetHeight - (window.innerHeight - PIN);
      const p = Math.min(1, Math.max(0, (PIN - wrap.getBoundingClientRect().top) / Math.max(1, total)));
      setActive(Math.min(CHAPTERS.length - 1, Math.floor(p * CHAPTERS.length + 0.001)));
      return;
    }
    const arts = Array.from(wrap.querySelectorAll('article'));
    if (!arts.length) return;
    const focus = window.innerHeight * 0.4;
    let best = 0;
    let bestD = Infinity;
    arts.forEach((a, i) => {
      const r = a.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - focus);
      if (d < bestD) { bestD = d; best = i; }
    });
    setActive(best);
  });

  const jump = useCallback((i) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const behavior = reduced ? 'auto' : 'smooth';
    if (desktop) {
      const total = wrap.offsetHeight - (window.innerHeight - PIN);
      const top = wrap.getBoundingClientRect().top + window.scrollY - PIN;
      window.scrollTo({ top: top + total * ((i + 0.45) / CHAPTERS.length), behavior });
      return;
    }
    const art = wrap.querySelectorAll('article')[i];
    if (!art) return;
    window.scrollTo({ top: art.getBoundingClientRect().top + window.scrollY - PIN - 24, behavior });
  }, [desktop, reduced]);

  return (
    <main style={{
      fontFamily: FONT.body, color: C.body, background: C.canvas,
      overflowX: 'clip', // NOT `hidden` — that would break position: sticky
    }}
    >
      <Hero desktop={desktop} modelUrl={modelUrl} staticLogoSrc={staticLogoSrc} />

      {/* The rail and the chapters share one wrapper so the rail unsticks with them. */}
      <div>
        <CapabilityRail active={active} onJump={jump} />
        <Chapters
          desktop={desktop}
          active={active}
          wrapRef={wrapRef}
          scrollHeightVh={chapterScrollVh}
          onJump={jump}
        />
      </div>

      <CtaBand />
      <Steps />
      <TrustStrip />
      <Features />
      <Compare />
      <Faq desktop={desktop} />
      <Contact desktop={desktop} onSubmit={onContactSubmit} />
      <Footer />
    </main>
  );
}
