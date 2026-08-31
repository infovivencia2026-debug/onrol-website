import { motion } from "framer-motion";
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";

const PrivacyPolicy = () => {
  const lastUpdated = "10 April 2026";

  return (
    <main
      className="bg-[#f3f5f8] pt-28 text-white"
      style={{ fontFamily: `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif` }}
    >
      <section className="min-h-[70svh] py-16">
        <Container>
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border border-white/10 bg-[#3f3f3f] p-6 md:p-10"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">— Legal</p>
            <h1
              className="mt-2 text-white"
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                fontWeight: 800,
              }}
            >
              Privacy Policy
            </h1>
            <p className="mt-2 text-[13px] text-slate-400">Last updated: {lastUpdated}</p>

            <div className="mt-8 space-y-6 text-slate-200">
              <section>
                <h2 className="text-xl font-semibold text-white">1. Who We Are</h2>
                <p className="mt-2">
                  ONROL is operated by <strong className="text-white">Vivencia Educational Services</strong>
                  {" "}(&ldquo;Vivencia&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), an Indian education and technology
                  services provider based in Hyderabad, Telangana, India. ONROL covers two products under the same
                  entity:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                  <li>
                    <strong className="text-white">ONROL — AI Execution School:</strong> Live online programmes
                    (e.g., the AI Generalist Program) for students, professionals, and freelancers.
                  </li>
                  <li>
                    <strong className="text-white">ONROL Task Manager:</strong> A B2B field sales CRM and task
                    coordination platform.
                  </li>
                </ul>
                <p className="mt-2">
                  This policy explains how Vivencia Educational Services collects, uses, stores, and protects data
                  across both products and the <code className="rounded bg-slate-800 px-1.5 py-0.5 text-[12px]">onrol.in</code>{" "}
                  website.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">1A. Payment Data &amp; Razorpay</h2>
                <p className="mt-2">
                  Course fees, programme enrolments, and any other paid offerings are processed by{" "}
                  <strong className="text-white">Razorpay Software Private Limited</strong> on behalf of Vivencia
                  Educational Services. When you make a payment:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                  <li>
                    Your card details, UPI ID, net-banking credentials, and CVV are{" "}
                    <strong className="text-white">never seen, stored, or processed by Vivencia or ONROL</strong> —
                    they are entered on Razorpay&rsquo;s PCI-DSS compliant checkout and tokenised by Razorpay directly.
                  </li>
                  <li>
                    We receive only a Razorpay Order ID, Payment ID, the amount paid, the payment method category
                    (UPI/card/netbanking), and your name and email as registered with Razorpay — enough to issue an
                    invoice and confirm enrolment.
                  </li>
                  <li>
                    Razorpay&rsquo;s privacy policy and PCI-DSS compliance are available at{" "}
                    <a href="https://razorpay.com/privacy" className="text-orange-200 underline underline-offset-2" target="_blank" rel="noopener noreferrer">
                      razorpay.com/privacy
                    </a>.
                  </li>
                  <li>
                    Refunds (when approved per the{" "}
                    <a href="/refund-policy/" className="text-orange-200 underline underline-offset-2">Refund Policy</a>
                    ) are issued back to the original payment instrument via Razorpay only.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
                <p className="mt-2">We collect the following categories of data:</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate-300">
                  <li>
                    <strong className="text-white">Account data:</strong> Your full name, email address, department,
                    and role (admin or employee) when you register or are invited to the platform.
                  </li>
                  <li>
                    <strong className="text-white">Profile photo:</strong> Images you upload are stored in Supabase
                    Storage (avatars bucket) and are publicly readable via a URL tied to your user ID.
                  </li>
                  <li>
                    <strong className="text-white">Task and visit data:</strong> Tasks you create, update, or complete,
                    institution records, visit logs (check-in / check-out), activity events, pipeline stages, and
                    follow-up notes.
                  </li>
                  <li>
                    <strong className="text-white">GPS / location data:</strong> If you perform a visit check-in or
                    use the Journey Planner, your device GPS coordinates may be recorded and stored against the visit
                    log. Location is only read when you initiate a relevant action — we do not track location
                    continuously.
                  </li>
                  <li>
                    <strong className="text-white">Push notification tokens (FCM):</strong> If you grant notification
                    permission on Android, a Firebase Cloud Messaging (FCM) device token is saved to your account so
                    task assignment and reminder notifications can be delivered. Tokens are stored in our database and
                    rotated automatically by Firebase.
                  </li>
                  <li>
                    <strong className="text-white">Messenger messages:</strong> In-app messages between team members
                    are stored in our database. Messages are not end-to-end encrypted and may be accessible to
                    administrators within your organization.
                  </li>
                  <li>
                    <strong className="text-white">File transfers:</strong> Files shared using the peer-to-peer File
                    Transfer feature are transmitted directly between browsers using WebRTC and are not stored on our
                    servers. No copy is retained after the transfer session ends.
                  </li>
                  <li>
                    <strong className="text-white">Usage and diagnostic data:</strong> Error logs, boot step telemetry,
                    and performance data may be collected to help us identify and fix issues.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">3. How We Use Your Data</h2>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate-300">
                  <li>To provide and operate the ONROL Task Manager service for your organization.</li>
                  <li>To deliver push notifications for task assignments, reminders, and alerts.</li>
                  <li>To display visit history and GPS-tagged check-in / check-out records in dashboards.</li>
                  <li>To power the Xulo AI assistant using your task and institution data as local context.</li>
                  <li>To enable team communication through the Messenger feature.</li>
                  <li>To generate reports, activity summaries, and performance dashboards for admins.</li>
                  <li>To maintain security and audit logs within your organization's workspace.</li>
                </ul>
                <p className="mt-3">We do not sell your personal data to third parties.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">4. Data Storage and Processors</h2>
                <p className="mt-2">
                  All application data is stored on <strong className="text-white">Supabase</strong> (PostgreSQL
                  database and object storage), hosted on cloud infrastructure. Firebase is used solely for push
                  notification token management and delivery. Data may be processed in data centres outside India;
                  however, both Supabase and Firebase maintain appropriate security certifications.
                </p>
                <p className="mt-2">
                  Supabase enforces Row-Level Security (RLS) policies on all tables so that each user can only access
                  data they are authorized to see.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">5. Data Retention</h2>
                <p className="mt-2">
                  Your data is retained as long as your organization's workspace is active. When an account is
                  deactivated, personal data is retained for up to 90 days before permanent deletion, unless legal
                  obligations require longer retention. Profile photos in storage are deleted when you overwrite or
                  remove them.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">6. Cookies and Local Storage</h2>
                <p className="mt-2">
                  ONROL uses browser local storage and session cookies for authentication state management (provided by
                  Supabase Auth). No third-party advertising or tracking cookies are used. You can clear local storage
                  via your browser settings, which will sign you out of the application.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">7. Security Measures</h2>
                <p className="mt-2">We implement the following security controls:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                  <li>TLS encryption for all data in transit.</li>
                  <li>Row-Level Security (RLS) policies on all Supabase database tables.</li>
                  <li>JWT-based authentication with token refresh and expiry.</li>
                  <li>HTTP security headers (HSTS, X-Frame-Options, CSP, X-Content-Type-Options, Referrer-Policy).</li>
                  <li>Signed Android APK releases using a protected keystore.</li>
                  <li>FCM tokens are scoped per user and never shared across accounts.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">8. Your Rights</h2>
                <p className="mt-2">You may exercise the following rights at any time:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                  <li><strong className="text-white">Access:</strong> Request a copy of your personal data.</li>
                  <li><strong className="text-white">Correction:</strong> Update your name, department, or profile photo directly in Settings.</li>
                  <li><strong className="text-white">Deletion:</strong> Request deletion of your account and associated data.</li>
                  <li><strong className="text-white">Notification opt-out:</strong> Disable push notifications in Settings at any time.</li>
                  <li><strong className="text-white">Location withdrawal:</strong> Deny location permissions in device settings to prevent GPS capture.</li>
                </ul>
                <p className="mt-3">
                  To exercise any right, contact us at{" "}
                  <a href="mailto:info@onrol.in" className="text-orange-200 underline underline-offset-2">
                    info@onrol.in
                  </a>
                  . We will respond within 3 months.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">9. Children's Privacy</h2>
                <p className="mt-2">
                  ONROL Task Manager is a professional tool intended for business users aged 18 and above. We do not
                  knowingly collect data from minors.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">10. Changes to This Policy</h2>
                <p className="mt-2">
                  We may update this policy as the platform evolves. Significant changes will be communicated via
                  in-app notification. Continued use of the platform after changes constitutes acceptance of the
                  updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">11. Contact</h2>
                <p className="mt-2">
                  ONROL, Hyderabad, Telangana, India<br />
                  Email:{" "}
                  <a href="mailto:info@onrol.in" className="text-orange-200 underline underline-offset-2">
                    info@onrol.in
                  </a>
                  <br />
                  Phone: +91 99665 77659
                </p>
              </section>
            </div>
          </motion.article>
        </Container>
      </section>
      <Footer />
    </main>
  );
};

export default PrivacyPolicy;
