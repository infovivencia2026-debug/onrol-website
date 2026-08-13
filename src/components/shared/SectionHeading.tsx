import { motion } from "framer-motion";
import { sectionReveal } from "@/lib/motion";

type SectionHeadingProps = {
  badge?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  gradientTitle?: boolean;
};

const SectionHeading = ({ badge, title, description, align = "left", tone = "dark", gradientTitle = true }: SectionHeadingProps) => {
  const alignment = align === "center" ? "text-center items-center" : "text-left items-start";
  const titleTone = gradientTitle
    ? tone === "light"
      ? "onrol-heading-gradient-light"
      : "onrol-heading-gradient-dark"
    : tone === "light"
      ? "text-[#f3f5f8]"
      : "text-[#0B1640]/85";
  const bodyTone = tone === "light" ? "text-[#404040]" : "text-[#0B1640]";

  return (
    <motion.div
      {...sectionReveal}
      className={`flex flex-col gap-3 ${alignment}`}
    >
      <h2 className={`font-display text-3xl font-bold tracking-tight md:text-4xl ${titleTone}`}>{title}</h2>
      {description ? <p className={`max-w-3xl text-base leading-relaxed md:text-lg ${bodyTone}`}>{description}</p> : null}
    </motion.div>
  );
};

export default SectionHeading;
