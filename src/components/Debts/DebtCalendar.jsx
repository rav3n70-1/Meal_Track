import React, { useMemo, useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const DebtCalendar = ({ debts }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentDate]);

    const debtsByDate = useMemo(() => {
        const map = {};
        debts.forEach(debt => {
            // Use expenseDate if available, otherwise debt date
            const date = debt.expenseDate || debt.date;
            if (!date) return;

            if (!map[date]) {
                map[date] = 0;
            }
            map[date] += parseFloat(debt.amount || 0);
        });
        return map;
    }, [debts]);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Get padding days for the first week
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const paddingDays = Array(firstDayOfMonth).fill(null);

    return (
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={18} className="text-primary" />
                        <CardTitle>Debt Calendar</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" onClick={prevMonth}>
                            <ChevronLeft size={16} />
                        </button>
                        <span className="font-medium min-w-[140px] text-center">{monthLabel}</span>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" onClick={nextMonth}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day}>{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {paddingDays.map((_, index) => (
                        <div key={`padding-${index}`} className="h-20 bg-gray-50/50 dark:bg-gray-900/20 rounded-md" />
                    ))}
                    {daysInMonth.map(date => {
                        const dateStr = date.toISOString().split('T')[0];
                        const total = debtsByDate[dateStr] || 0;
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;

                        return (
                            <div
                                key={dateStr}
                                className={`h-20 p-1 rounded-md border flex flex-col justify-between transition-colors ${isToday
                                    ? 'border-primary/50 bg-primary/5'
                                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
                                    } ${total > 0 ? 'hover:border-primary/30 cursor-pointer' : ''}`}
                            >
                                <div className="text-xs text-right text-gray-400">
                                    {date.getDate()}
                                </div>
                                {total > 0 && (
                                    <div className="text-xs font-bold text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 rounded py-1">
                                        ৳{total.toFixed(0)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default DebtCalendar;
