import { motion } from "framer-motion";

const SECTIONS = [
  {
    title: "1. What Chasqr Is",
    body: "Chasqr lets you upload static website files (HTML, CSS, JavaScript, images, and the compiled output of frontend frameworks like React, Vue, or Angular) and get a live, shareable URL instantly. You can edit content, manage SEO, connect a custom domain, and optionally get help from a verified expert.",
  },
  {
    title: "2. Your Account",
    body: "You're responsible for keeping your login credentials secure and for all activity under your account. You must provide accurate information when registering and are responsible for maintaining the accuracy of your account details.",
  },
  {
    title: "3. Acceptable Use",
    body: "You may not upload content that is illegal, infringes on others' intellectual property, contains malware, or is used to phish, scam, or harm others. We reserve the right to suspend or remove any site that violates these terms without prior notice.",
  },
  {
    title: "4. What We Store",
    body: "We store the files you upload (your compiled/built output) to serve your site. We do not store your original source code repository, git history, or uncompiled project files — only what you choose to upload. See our Dashboard for more on why we work this way.",
  },
  {
    title: "5. Payments",
    body: "Uploads over 5 MB require a one-time payment per site, processed securely through Lemon Squeezy. Once paid, that site can be redeployed at any size going forward. Payments are non-refundable except where required by law.",
  },
  {
    title: "6. Expert Support",
    body: "Chasqr connects you with independent experts for paid or unpaid help with your site. Chasqr is not a party to any payment arrangement between you and an expert — you deal with experts directly, and Chasqr does not guarantee the quality of their work.",
  },
  {
    title: "7. Service Availability",
    body: "We aim to keep Chasqr available and reliable but do not guarantee uninterrupted service. We may perform maintenance, updates, or changes to features at any time.",
  },
  {
    title: "8. Termination",
    body: "You may delete your sites and account at any time. We may suspend or terminate accounts that violate these terms or applicable law.",
  },
  {
    title: "9. Limitation of Liability",
    body: "Chasqr is provided \"as is\" without warranties of any kind. We are not liable for indirect, incidental, or consequential damages arising from your use of the service.",
  },
  {
    title: "10. Changes to These Terms",
    body: "We may update these terms from time to time. Continued use of Chasqr after changes are posted constitutes acceptance of the updated terms.",
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-bebas text-5xl text-slate-900 mb-2">Terms &amp; Conditions</h1>
          <p className="text-slate-400 text-sm mb-10">Last updated: July 5, 2026</p>

          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="font-semibold text-slate-800 text-base mb-2">{s.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
              </section>
            ))}
          </div>

          <p className="text-xs text-slate-400 mt-12">
            Questions about these terms? Reach out via your dashboard's Expert Help section or your account email.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
