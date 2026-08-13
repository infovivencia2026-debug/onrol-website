import { MessageCircle } from "lucide-react";
import { homeData } from "@/lib/homeData";

const WhatsAppBubble = () => (
  <a
    href={homeData.footer.social.whatsapp}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat with ONROL on WhatsApp"
    className="group fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-[#0B1640] transition hover:scale-110 md:bottom-6 md:right-6"
  >
    {/* Phone-style WhatsApp icon (lucide MessageCircle as visual stand-in, tinted brand green) */}
    <MessageCircle className="h-6 w-6 fill-white stroke-[#25D366]" strokeWidth={1.5} />
    <span className="pointer-events-none absolute -top-1 -right-1 flex h-3 w-3">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
    </span>
  </a>
);

export default WhatsAppBubble;
