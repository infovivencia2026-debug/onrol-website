import { motion } from "framer-motion";
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";

const TermsAndConditions = () => {
  const lastUpdated = "23 May 2026";

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
              Terms &amp; Conditions
            </h1>
            <p className="mt-2 text-[13px] text-slate-400">Last updated: {lastUpdated}</p>

            <div className="mt-8 space-y-6 text-slate-200">
              <section>
                <h2 className="text-xl font-semibold text-white">0. Operating Entity</h2>
                <p className="mt-2">
                  ONROL is owned and operated by <strong className="text-white">Vivencia Educational Services</strong>
                  {" "}(&ldquo;Vivencia&rdquo;, &ldquo;the Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), an Indian
                  education and technology services provider based in Hyderabad, Telangana, India. All ONROL programmes,
                  software products, invoices, contracts, and refunds are issued under Vivencia Educational Services.
                </p>
                <p className="mt-2">
                  Payments for paid programmes are processed by{" "}
                  <strong className="text-white">Razorpay Software Private Limited</strong> on behalf of Vivencia
                  Educational Services. By making a payment, you also accept Razorpay&rsquo;s applicable terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
                <p className="mt-2">
                  By accessing or using the <code className="rounded bg-slate-800 px-1.5 py-0.5 text-[12px]">onrol.in</code>{" "}
                  website, enrolling in any ONROL programme (including but not limited to the AI Generalist Program,
                  AI Agents Masterclass, Career Catalyst Webinar), or using the ONROL Task Manager platform — including
                  the web application, Android app, desktop application, and any associated APIs — you agree to be
                  bound by these Terms and Conditions. If you do not agree, do not use the platform or enrol.
                </p>
                <p className="mt-2">
                  These terms apply to all users including programme learners, organization administrators, field
                  employees, and any third-party integrators.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">1A. ONROL Education Programmes</h2>
                <p className="mt-2">
                  The ONROL AI Generalist Program and related cohort programmes are live, instructor-led training
                  offerings delivered online by Vivencia Educational Services. Specific cohort dates, session counts,
                  fees, and inclusions are published on the relevant landing page at the time of enrolment.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                  <li>
                    Programme fees are payable in Indian Rupees (INR) and inclusive of applicable taxes unless stated
                    otherwise on the checkout page.
                  </li>
                  <li>
                    Enrolment is confirmed only upon successful payment and receipt of a Vivencia Educational Services
                    invoice and Razorpay Payment ID via email.
                  </li>
                  <li>
                    Refunds, cohort transfers, and cancellations are governed by our{" "}
                    <a href="/refund-policy/" className="text-orange-200 underline underline-offset-2">Refund Policy</a>.
                  </li>
                  <li>
                    Vivencia reserves the right to update curriculum, swap tools, or adjust session order to keep the
                    programme current. Material changes will not reduce the contracted session count or duration.
                  </li>
                  <li>
                    Course materials, recordings, and templates are licensed to you for personal learning use only.
                    You may not resell, redistribute, or repurpose them commercially without written permission.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">2. Platform Description</h2>
                <p className="mt-2">
                  ONROL Task Manager is a B2B field sales CRM and task coordination platform. It enables organizations
                  to manage tasks, track field visits, communicate via messenger, share files, plan journeys, and
                  receive push notifications for business activities. The platform is provided as a Software-as-a-Service
                  (SaaS) product hosted on Supabase infrastructure.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">3. Account Access and Roles</h2>
                <p className="mt-2">
                  Access is granted by invitation from an organization administrator. You must provide accurate
                  information during account creation. Two roles exist within the platform:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                  <li>
                    <strong className="text-white">Admin:</strong> Full access to create and assign tasks, manage team
                    members, view all records, configure automation, and access reports.
                  </li>
                  <li>
                    <strong className="text-white">Employee:</strong> Access to assigned tasks, visit logs, journey
                    planner, messenger, and personal settings. Employees cannot view other employees' private data.
                  </li>
                </ul>
                <p className="mt-2">
                  You are responsible for maintaining the confidentiality of your credentials. You must notify us
                  immediately at{" "}
                  <a href="mailto:info@onrol.in" className="text-orange-200 underline underline-offset-2">
                    info@onrol.in
                  </a>{" "}
                  if you suspect unauthorized access to your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">4. Acceptable Use</h2>
                <p className="mt-2">You agree not to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                  <li>Use the platform for any unlawful purpose or in violation of applicable laws.</li>
                  <li>Share your login credentials with unauthorized individuals.</li>
                  <li>Attempt to reverse-engineer, decompile, or circumvent any security measure.</li>
                  <li>Upload files containing malware, viruses, or harmful code via the File Transfer feature.</li>
                  <li>Submit false GPS coordinates or manipulate visit check-in / check-out data.</li>
                  <li>Abuse the Messenger or AI assistant features to generate harmful or offensive content.</li>
                  <li>Use automated scripts or bots to access the platform in a manner that degrades service.</li>
                </ul>
                <p className="mt-2">
                  ONROL reserves the right to suspend or terminate accounts found in violation of these terms
                  without prior notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">5. Data and Content Ownership</h2>
                <p className="mt-2">
                  Your organization owns all data you input into the platform — including tasks, visit logs, institution
                  records, messages, and uploaded files. ONROL does not claim ownership of your business data.
                </p>
                <p className="mt-2">
                  ONROL owns all platform software, UI design, branding, logos, and underlying infrastructure. You
                  may not copy, redistribute, or resell any part of the platform without written permission.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">6. GPS and Location Data</h2>
                <p className="mt-2">
                  When you perform a visit check-in or use the Journey Planner, the platform may capture your device's
                  GPS coordinates. By using these features, you consent to this data being recorded against your user
                  account and visible to your organization's administrators. You may withdraw this consent by denying
                  location permissions in your device settings, which will disable GPS-dependent features.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">7. Push Notifications</h2>
                <p className="mt-2">
                  By granting notification permissions, you consent to receiving task assignment alerts, visit
                  reminders, and admin notifications via Firebase Cloud Messaging (FCM). You can withdraw consent
                  by disabling notifications in the Settings section of the app or through your device's system
                  settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">8. File Transfer</h2>
                <p className="mt-2">
                  The peer-to-peer File Transfer feature transmits files directly between browsers using WebRTC.
                  ONROL does not store, inspect, or retain transferred files. You are responsible for ensuring that
                  files you share comply with applicable laws and do not infringe third-party rights.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">9. Xulo AI Assistant</h2>
                <p className="mt-2">
                  The Xulo AI assistant uses your task and institution data to generate responses and suggestions.
                  AI-generated content is provided for informational purposes only and does not constitute business
                  advice. ONROL is not liable for decisions made based on AI suggestions. The assistant may
                  optionally connect to an external AI service; in that case, a summary of your task context (not
                  raw personal data) may be sent to the AI provider.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">10. Service Availability</h2>
                <p className="mt-2">
                  ONROL strives for high availability but does not guarantee uninterrupted service. Scheduled
                  maintenance, infrastructure updates, or force majeure events may cause temporary downtime. The
                  platform includes offline queuing for key actions so that work created without connectivity is
                  synced when the connection is restored.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">11. Limitation of Liability</h2>
                <p className="mt-2">
                  To the maximum extent permitted by applicable law, ONROL and its affiliates shall not be liable
                  for any indirect, incidental, special, or consequential damages arising from your use of or
                  inability to use the platform, including but not limited to loss of data, revenue, or business
                  opportunities. Our total liability for any claim shall not exceed the amount paid by your
                  organization for the platform in the 12 months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">12. Modifications</h2>
                <p className="mt-2">
                  We reserve the right to modify these Terms at any time. Changes will be communicated via in-app
                  notification. Continued use of the platform after changes take effect constitutes acceptance of
                  the revised Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">13. Governing Law</h2>
                <p className="mt-2">
                  These Terms are governed by and construed in accordance with the laws of India. Any disputes
                  arising from these Terms or your use of the platform shall be subject to the exclusive
                  jurisdiction of the courts in Hyderabad, Telangana, India.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">14. Contact</h2>
                <p className="mt-2">
                  For questions about these Terms, contact us at:<br />
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

export default TermsAndConditions;
