// Expense Calendar Component
import React, { useState } from 'react';
import { useHousehold } from '../../context/HouseholdContext';
import { getCategoryById } from '../../utils/categories';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const ExpenseCalendar = ({ onDateClick }) => {
  const { expenses } = useHousehold();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getExpensesForDate = (day) => {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    
    return expenses.filter(expense => {
      return expense.date === dateStr && expense.status === 'approved';
    });
  };

  const getDayTotal = (day) => {
    const dayExpenses = getExpensesForDate(day);
    return dayExpenses.reduce((sum, exp) => sum + (parseFloat(exp.totalAmount) || parseFloat(exp.amount) || 0), 0);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayExpenses = getExpensesForDate(day);
    const total = getDayTotal(day);
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

    days.push(
      <motion.div
        key={day}
        whileHover={{ scale: 1.05 }}
        onClick={() => onDateClick && onDateClick(new Date(year, month, day))}
        className={`
          aspect-square p-2 border border-border rounded-lg cursor-pointer transition-all
          ${isToday ? 'bg-primary/10 border-primary' : 'hover:bg-accent'}
          ${dayExpenses.length > 0 ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
        `}
      >
        <div className="flex flex-col h-full">
          <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
            {day}
          </span>
          {dayExpenses.length > 0 && (
            <div className="mt-auto">
              <div className="flex flex-wrap gap-0.5 mb-1">
                {dayExpenses.slice(0, 3).map((exp, idx) => {
                  const category = getCategoryById(exp.category);
                  return (
                    <span key={idx} className="text-xs" title={exp.items?.[0]?.name || 'Expense'}>
                      {category.emoji}
                    </span>
                  );
                })}
                {dayExpenses.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{dayExpenses.length - 3}</span>
                )}
              </div>
              <p className="text-xs font-semibold text-primary">৳{total.toFixed(0)}</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon size={24} />
            {monthNames[month]} {year}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 hover:bg-accent rounded-lg transition-colors text-sm font-medium"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2">
          {dayNames.map(name => (
            <div key={name} className="text-center text-sm font-medium text-muted-foreground py-2">
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Has Expenses</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ExpenseCalendar;

