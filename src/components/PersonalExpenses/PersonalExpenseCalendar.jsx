import React, { useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePersonalExpense } from '../../context/PersonalExpenseContext';
import Button from '../ui/Button';

const PersonalExpenseCalendar = () => {
    const { personalExpenses } = usePersonalExpense();
    const [currentDate, setCurrentDate] = React.useState(new Date());

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

    const expensesByDate = useMemo(() => {
        const map = {};
        personalExpenses.forEach(expense => {
            const date = expense.date; // YYYY-MM-DD
            if (!map[date]) {
                map[date] = 0;
            }
            map[date] += parseFloat(expense.amount || 0);
        });
        return map;
    }, [personalExpenses]);

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
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={18} />
                        <CardTitle>Expense Calendar</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={prevMonth} icon={<ChevronLeft size={16} />} />
                        <span className="font-medium min-w-[140px] text-center">{monthLabel}</span>
                        <Button variant="ghost" size="sm" onClick={nextMonth} icon={<ChevronRight size={16} />} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-muted-foreground">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day}>{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {paddingDays.map((_, index) => (
                        <div key={`padding-${index}`} className="h-20 bg-accent/20 rounded-md" />
                    ))}
                    {daysInMonth.map(date => {
                        const dateStr = date.toISOString().split('T')[0];
                        const total = expensesByDate[dateStr] || 0;
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;

                        return (
                            <div
                                key={dateStr}
                                className={`h-20 p-1 rounded-md border flex flex-col justify-between ${isToday ? 'border-primary bg-primary/5' : 'border-border bg-card'
                                    } ${total > 0 ? 'hover:bg-accent cursor-pointer' : ''}`}
                            >
                                <div className="text-xs text-right text-muted-foreground">
                                    {date.getDate()}
                                </div>
                                {total > 0 && (
                                    <div className="text-xs font-bold text-primary text-center bg-primary/10 rounded py-1">
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

export default PersonalExpenseCalendar;
