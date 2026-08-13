import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Award, Download, ExternalLink, Shield } from "lucide-react";
import { toast } from "sonner";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { LearnShell } from "@/components/learn/LearnShell";
import { lmsListMyCertificates, lmsRenderCertificatePdf, type LmsCertificate } from "@/lib/lmsClient";
import "@/styles/learn-shell.css";

/**
 * `/learn/me/certificates` — student-facing list of issued certificates.
 *
 * The PDF URL is lazily rendered: certs in the DB don't have `pdf_url`
 * until the first request via `lmsRenderCertificatePdf(code)`. We
 * pre-fetch on download click to keep the initial list query light.
 *
 * Verification link goes to the public verifier page on the marketing
 * site at /verify/<code> so external recipients (employers etc.) can
 * confirm authenticity without a login.
 */
export default function LearnCertificates() {
  const { user, loading: authLoading } = useLmsAuth();
  const [certs, setCerts] = useState<LmsCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const rows = await lmsListMyCertificates();
        if (!cancelled) setCerts(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!authLoading && !user) return <Navigate to="/learn/login" replace />;

  async function downloadCert(c: LmsCertificate) {
    setDownloading(c.id);
    try {
      const url = c.pdf_url || (await lmsRenderCertificatePdf(c.verification_code));
      if (!url) { toast.error("Could not render certificate."); return; }
      // Update the row locally so the next click is instant.
      setCerts((rows) => rows.map((r) => r.id === c.id ? { ...r, pdf_url: url } : r));
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <LearnShell>
      <header className="lh-exams-head">
        <div>
          <h1>Certificates</h1>
          <p>Every course you've completed. Each cert has a public verification code recruiters can check.</p>
        </div>
      </header>

      {loading ? (
        <div className="lh-stub" style={{ padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : certs.length === 0 ? (
        <div className="lh-stub">
          <div className="lh-stub-icon"><Award /></div>
          <h2>No certificates yet</h2>
          <p>Finish a course (complete all lessons + pass any exams) and a certificate will be issued here automatically — typically within minutes.</p>
        </div>
      ) : (
        <section className="lh-certs">
          {certs.map((c) => (
            <article key={c.id} className="lh-cert">
              <div className="lh-cert-medal" aria-hidden><Award /></div>
              <div className="lh-cert-body">
                <h4>{c.course_title_snapshot || "Course"}</h4>
                <p className="lh-cert-name">{c.full_name_snapshot ?? user?.full_name ?? user?.email}</p>
                <p className="lh-cert-meta">
                  Issued {new Date(c.issued_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                  <span className="lh-cert-sep">·</span>
                  <span className="lh-cert-code">code <code>{c.verification_code}</code></span>
                </p>
              </div>
              <div className="lh-cert-actions">
                <button
                  type="button"
                  className="lh-cert-btn lh-cert-btn--primary"
                  onClick={() => downloadCert(c)}
                  disabled={downloading === c.id}
                >
                  {downloading === c.id
                    ? <Loader2 className="animate-spin" size={14} />
                    : <Download size={14} />}
                  PDF
                </button>
                <a
                  href={`/verify/${encodeURIComponent(c.verification_code)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="lh-cert-btn lh-cert-btn--ghost"
                >
                  <Shield size={14} /> Verify
                  <ExternalLink size={11} />
                </a>
              </div>
            </article>
          ))}
        </section>
      )}
    </LearnShell>
  );
}
