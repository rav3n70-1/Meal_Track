// Currency display component for Bangladesh Taka
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, formatBanglaCurrency } from '../../utils/currency';

const Currency = ({ amount, className = '', animate = false, size = 'md' }) => {
  const { isBangla } = useLanguage();
  
  const formatted = isBangla ? formatBanglaCurrency(amount) : formatCurrency(amount);
  
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  };

  if (animate) {
    return (
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className={`${sizes[size]} ${className}`}
      >
        {formatted}
      </motion.span>
    );
  }

  return <span className={`${sizes[size]} ${className}`}>{formatted}</span>;
};

export default Currency;

