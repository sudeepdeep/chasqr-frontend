import { toast } from "react-toastify";
import api from "../api/axios";
import LandingPro from "./LandingPro";

/**
 * The marketing site's own contact form has no bespoke backend — so it posts
 * through the same public endpoint every customer site's form uses. Set
 * REACT_APP_CONTACT_SITE_ID to a site you own and the messages land in that
 * site's Submissions tab, with the existing rate limiting and (on Pro) the
 * email notification already applied.
 *
 * With nothing configured it deliberately throws rather than resolving: the
 * hand-off only shows its "sent" state after this promise succeeds, and a form
 * that reports success while dropping the message on the floor is worse than
 * one that visibly fails.
 */

async function submitContact(form: Record<string, string>): Promise<void> {
  try {
    await api.post(`/api/forms/landing/submit`, form);
  } catch (err) {
    toast.error("Couldn't send that — please try again.");
    throw err;
  }
}

/**
 * Wrapper around the design hand-off page (LandingPro.jsx, plain React with
 * inline styles).
 *
 * The `.landing-pro` class scopes the hand-off's link, focus and selection
 * styles to this page — applied globally as its README suggests, they would
 * repaint the dashboard and admin panel too. Keeping the vendored .jsx
 * otherwise untouched means a future re-export from the design tool drops
 * straight back in, with the integration living out here instead.
 */
export default function Landing3D() {
  return (
    <div className="landing-pro">
      <LandingPro
        modelUrl={`${process.env.PUBLIC_URL || ""}/chasqr-logo.glb`}
        staticLogoSrc={`${process.env.PUBLIC_URL || ""}/chasqr-logo.png`}
        onContactSubmit={submitContact}
      />
    </div>
  );
}
