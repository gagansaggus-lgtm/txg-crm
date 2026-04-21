"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";

const EASE = [0.2, 0.7, 0.2, 1] as const;

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

type StaggerProps = HTMLMotionProps<"div">;

export function StaggerContainer(props: StaggerProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      {...props}
    />
  );
}

export function StaggerItem(props: StaggerProps) {
  return <motion.div variants={itemVariants} {...props} />;
}

export function FadeInUp({
  delay = 0,
  children,
  className,
  ...rest
}: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
