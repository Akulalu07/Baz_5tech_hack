import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  fullWidth?: boolean;
}

export const Button = ({ className, variant = 'primary', fullWidth, children, ...props }: ButtonProps) => {
  const baseStyles = "font-bold py-3 px-6 rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-wide flex items-center justify-center";
  
  const variants = {
    primary: "bg-x5green text-white border-x5green-dark hover:bg-opacity-90",
    secondary: "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
    danger: "bg-red-500 text-white border-red-700 hover:bg-red-600",
    outline: "bg-transparent border-2 border-gray-300 text-gray-500 hover:bg-gray-50 border-b-4"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={cn(baseStyles, variants[variant], fullWidth && "w-full", className)}
      {...props}
    >
      {children}
    </motion.button>
  );
};
