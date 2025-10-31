// Reusable Input component
import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  type = 'text',
  label,
  error,
  className = '',
  containerClassName = '',
  icon,
  ...props 
}, ref) => {
  const baseStyles = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  const errorStyles = error ? 'border-destructive focus-visible:ring-destructive' : '';

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={`${baseStyles} ${errorStyles} ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

