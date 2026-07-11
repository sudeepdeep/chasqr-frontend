import { motion } from "framer-motion";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We collect the information you provide when you register (name, email), the files you upload to deploy sites, and basic usage data such as visit counts for your deployed sites. If you sign in with Google, we receive your name and email from Google.",
  },
  {
    title: "2. What We Store — and What We Don't",
    body: "We store your uploaded build output (HTML, CSS, JS, images, etc.) so we can serve your live site. We do not access, store, or require your source code repository, git history, or original project files beyond what you explicitly upload.",
  },
  {
    title: "3. How We Use Your Information",
    body: "We use your information to operate your account, host and serve your sites, send transactional emails (password resets, code-share notifications, receipts), and process payments for large uploads or expert support.",
  },
  {
    title: "4. Third-Party Services",
    body: "We use MongoDB Atlas for data storage, Resend for transactional email, Razorpay for payment processing, and Google for optional sign-in. Each provider processes data under its own privacy policy.",
  },
  {
    title: "5. Expert Support & Code Sharing",
    body: "If you choose to share your site's code with a support expert, a time-limited download link is generated and emailed to that expert. This link expires automatically and access is revoked once your support request is completed.",
  },
  {
    title: "6. Data Retention",
    body: "We retain your account and site data until you delete your site or account. Deleted sites and their files are permanently removed from our database.",
  },
  {
    title: "7. Your Rights",
    body: "You can access, update, or delete your sites at any time from your dashboard. To delete your account entirely, contact us via your account email.",
  },
  {
    title: "8. Security",
    body: "We use industry-standard practices including password hashing, HTTPS/TLS for all traffic, and scoped access tokens for expert support to protect your data.",
  },
  {
    title: "9. Changes to This Policy",
    body: "We may update this privacy policy from time to time. Material changes will be reflected with an updated date at the top of this page.",
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-bebas text-5xl text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-400 text-sm mb-10">Last updated: July 5, 2026</p>

          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="font-semibold text-slate-800 text-base mb-2">{s.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
              </section>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
