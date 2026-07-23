import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getSiteAPI } from '../api/site.api';
import { publicSiteUrl } from '../lib/siteUrl';
import LayoutBuilder from '../components/LayoutBuilder';

// Dedicated full-screen visual builder: left element/banner/effects palette,
// right drag-and-drop canvas. Rendered outside the app chrome so it takes over
// the whole viewport.
export default function Builder() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    getSiteAPI(siteId)
      .then((res) => setSite(res.data.data.site))
      .catch(() => toast.error('Failed to load site'))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!site || !siteId) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white text-slate-500 gap-3">
        <p>Site not found.</p>
        <button onClick={() => navigate('/dashboard')} className="text-primary text-sm hover:underline">← Back to Dashboard</button>
      </div>
    );
  }

  const pages: any[] = site.pages || [];
  const pageName = searchParams.get('page') || pages[0]?.filename || 'index.html';
  const page = pages.find((p) => p.filename === pageName) || pages[0];

  if (!page) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white text-slate-500">This site has no editable page.</div>
    );
  }

  return (
    <LayoutBuilder
      key={page.filename}
      siteId={siteId}
      page={page.filename}
      initialLayout={page.layout}
      initialLayoutStyle={page.layoutStyle}
      initialNav={page.nav}
      initialFooter={page.footer}
      fullscreen
      previewUrl={site.slug ? publicSiteUrl(site.slug) : undefined}
      onExit={() => navigate(`/sites/${siteId}?tab=layout`)}
      onSaved={(s) => setSite(s)}
    />
  );
}
