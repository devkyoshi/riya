import type { Variants } from "framer-motion";

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.2 } },
};

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit:   { opacity: 0, x: -40, transition: { duration: 0.2, ease: "easeIn" } },
};

export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit:   { opacity: 0, x: 40, transition: { duration: 0.2, ease: "easeIn" } },
};
