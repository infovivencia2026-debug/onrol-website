import { motion } from "framer-motion";
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";

const RefundPolicy = () => {
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
              Refund Policy
            </h1>
            <p className="mt-2 text-[13px] text-slate-400">Last updated: {lastUpdated}</p>

            <div className="mt-8 space-y-6 text-slate-200">
              <section>
                <h2 className="text-xl font-semibold text-white">About the Operating Entity</h2>
                <p className="mt-2">
                  ONROL is a programme operated by <strong className="text-white">Vivencia Educational Services</strong>
                  {" "}(&ldquo;Vivencia&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). All course enrolments, fees, invoices,
                  and refunds are issued under Vivencia Educational Services. Payments are processed by{" "}
                  <strong className="text-white">Razorpay Software Private Limited</strong> on behalf of Vivencia
                  Educational Services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">1. Refund Eligibility — Live Cohort Programmes</h2>
                <p className="mt-2">
                  For the ONROL AI Generalist Program and other live-cohort offerings, the following refund window
                  applies:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                  <li>
                    <strong className="text-white">Full refund (100%):</strong> Cancellation request received in writing
                    at least <strong className="text-white">7 calendar days before</strong> the cohort start date.
                  </li>
                  <li>
                    <strong className="text-white">Partial refund (50%):</strong> Cancellation request received between
                    7 days and 24 hours before the cohort start date.
                  </li>
                  <li>
                    <strong className="text-white">No refund:</strong> Cancellation requested after the cohort has
                    commenced or within 24 hours of the start date. Recordings and materials remain accessible.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">2. Non-Refundable Components</h2>
                <p className="mt-2">
                  Payment gateway charges, applicable GST, and any third-party licence costs (e.g., paid tool accounts
                  procured on your behalf) are non-refundable once consumed. These will be itemised transparently at
                  enrolment.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">3. Cohort Transfer (Alternative to Refund)</h2>
                <p className="mt-2">
                  In place of a refund, you may transfer your enrolment to the next available cohort at no additional
                  cost, provided the request is made at least 24 hours before the cohort start date and seats are
                  available. Transfers are limited to one per enrolment.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">4. Refund Processing Timeline</h2>
                <p className="mt-2">
                  Approved refunds are processed back to the original payment source via Razorpay, typically within
                  <strong className="text-white"> 7 to 10 business days</strong> of approval. Bank-side credit may take
                  an additional 2-3 working days depending on your card or bank.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">5. Programme Cancellation by Vivencia</h2>
                <p className="mt-2">
                  In the unlikely event that a cohort is cancelled or postponed by Vivencia Educational Services, you
                  will receive a <strong className="text-white">100% refund</strong> within 10 business days, or the
                  option to transfer to a future cohort, whichever you prefer.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">6. How to Request a Refund</h2>
                <p className="mt-2">
                  Email{" "}
                  <a href="mailto:info@onrol.in" className="text-orange-200 underline underline-offset-2">
                    info@onrol.in
                  </a>{" "}
                  with the subject &ldquo;Refund Request&rdquo; and include:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                  <li>Your registered name, email, and phone number</li>
                  <li>Razorpay Order ID or Payment ID from your confirmation email</li>
                  <li>Cohort name and start date</li>
                  <li>Reason for the refund request</li>
                </ul>
                <p className="mt-2">
                  Our team responds within <strong className="text-white">24 working hours</strong> with confirmation
                  and next steps. For urgent matters, call{" "}
                  <a href="tel:+919609312345" className="text-orange-200 underline underline-offset-2">96093 12345</a>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">7. Disputes &amp; Chargebacks</h2>
                <p className="mt-2">
                  Before initiating a chargeback through your card-issuing bank, please contact us first at{" "}
                  <a href="mailto:info@onrol.in" className="text-orange-200 underline underline-offset-2">
                    info@onrol.in
                  </a>. We resolve the vast majority of refund disputes directly within 7 working days. Any
                  unresolvable dispute will be governed by the laws of India, jurisdiction Hyderabad, Telangana.
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

export default RefundPolicy;
