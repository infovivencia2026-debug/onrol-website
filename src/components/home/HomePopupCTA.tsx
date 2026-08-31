import { motion } from "framer-motion";
import { Link } from "react-router-dom";

type HomePopupCTAProps = {
  label: string;
  href: string;
  className?: string;
};

const HomePopupCTA = ({ label, href, className = "" }: HomePopupCTAProps) => {
  const isHashLink = href.startsWith("#");
  const to = isHashLink ? `/${href}` : href;

  return (
    <motion.div
      initial={{ opacity: 1, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <Link
        to={to}
        className="inline-flex items-center rounded-full border border-orange-300/40 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 backdrop-blur-md transition-all duration-300 ease-out-premium hover:-translate-y-0.5 hover:bg-orange-500/20 active:scale-[0.99]"
      >
        {label}
      </Link>
    </motion.div>
  );
};

export default HomePopupCTA;
