// Date Picker Component
import React from 'react';
import { Calendar } from 'lucide-react';

const DatePicker = ({ 
  value, 
  onChange, 
  label, 
  required = false,
  min,
  max,
  className = '',
  ...props 
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          required={required}
          className="w-full px-4 py-2 pl-10 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          {...props}
        />
        <Calendar 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
          size={18} 
        />
      </div>
    </div>
  );
};

export default DatePicker;

