// Category selector component
import React from 'react';
import { EXPENSE_CATEGORIES } from '../../utils/categories';
import { motion } from 'framer-motion';

const CategorySelector = ({ value, onChange, label = "Category", required = false }) => {
  const selectedCategory = EXPENSE_CATEGORIES.find(cat => cat.id === value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {EXPENSE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = value === category.id;

          return (
            <motion.button
              key={category.id}
              type="button"
              onClick={() => onChange(category.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative p-3 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'border-primary bg-primary/10 shadow-md' 
                  : 'border-border bg-background hover:bg-accent'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">{category.emoji}</span>
                <span className="text-xs font-medium text-center line-clamp-1">
                  {category.label}
                </span>
              </div>
              {isSelected && (
                <motion.div
                  layoutId="category-selected"
                  className="absolute inset-0 border-2 border-primary rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySelector;

