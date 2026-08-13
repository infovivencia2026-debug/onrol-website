import { FaInstagram, FaLinkedinIn, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { homeData } from "@/lib/homeData";

const socials = [
  { label: "YouTube", href: homeData.footer.social.youtube, icon: FaYoutube, color: "text-[#FF0000]" },
  { label: "LinkedIn", href: homeData.footer.social.linkedin, icon: FaLinkedinIn, color: "text-[#0A66C2]" },
  { label: "Instagram", href: homeData.footer.social.instagram, icon: FaInstagram, color: "text-[#E1306C]" },
  { label: "WhatsApp", href: homeData.footer.social.whatsapp, icon: FaWhatsapp, color: "text-[#25D366]" },
];

const FloatingSocialBar = () => {
  return (
    <aside className="fixed right-3 top-1/2 z-[65] hidden -translate-y-1/2 flex-col gap-2 xl:flex">
      {socials.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#0B1640]/10 bg-white text-[#0B1640] shadow-[0_8px_20px_-12px_rgba(11,22,64,0.25)] transition-all duration-300 ease-out-premium hover:-translate-y-0.5 hover:border-orange-300/60 hover:shadow-[0_12px_24px_-10px_rgba(255,90,0,0.35)]"
        >
          <item.icon className={`h-4 w-4 ${item.color}`} />
        </a>
      ))}
    </aside>
  );
};

export default FloatingSocialBar;
