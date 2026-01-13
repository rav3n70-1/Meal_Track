import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
    Calendar,
    ChevronDown,
    ChevronUp,
    Edit,
    Trash2,
    Wallet
} from 'lucide-react';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';

const PersonalExpenseList = ({ expenses, onEdit, onDelete, getCategoryLabel }) => {
    const [expandedDates, setExpandedDates] = useState(new Set());

    // Group expenses by date
    const groupedExpenses = useMemo(() => {
        const groups = {};

        expenses.forEach(expense => {
            const date = expense.date;
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(expense);
        });

        // Sort dates descending
        const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

        return sortedDates.map(date => ({
            date,
            expenses: groups[date],
            totalAmount: groups[date].reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
        }));
    }, [expenses]);

    const toggleDate = (date) => {
        const newExpanded = new Set(expandedDates);
        if (newExpanded.has(date)) {
            newExpanded.delete(date);
        } else {
            newExpanded.add(date);
        }
        setExpandedDates(newExpanded);
    };

    if (expenses.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <Wallet className="mx-auto text-muted-foreground mb-4" size={48} />
                    <p className="text-muted-foreground mb-4">No personal expenses found</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {groupedExpenses.map((group) => (
                <Card key={group.date}>
                    {/* Date Header */}
                    <div
                        className="p-4 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => toggleDate(group.date)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="text-primary" size={20} />
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        {format(new Date(group.date), 'EEEE, MMMM dd, yyyy')}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {group.expenses.length} expense{group.expenses.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary">৳{group.totalAmount.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                </div>
                                {expandedDates.has(group.date) ? (
                                    <ChevronUp size={24} className="text-muted-foreground" />
                                ) : (
                                    <ChevronDown size={24} className="text-muted-foreground" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Expanded Expenses */}
                    <AnimatePresence>
                        {expandedDates.has(group.date) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden border-t border-border"
                            >
                                <div className="p-4 space-y-3">
                                    {group.expenses.map((expense, index) => (
                                        <motion.div
                                            key={expense.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex items-center justify-between p-4 bg-accent/50 rounded-lg hover:bg-accent transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold">{expense.title}</h3>
                                                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                                        {getCategoryLabel(expense.category)}
                                                    </span>
                                                </div>
                                                {expense.description && (
                                                    <p className="text-sm text-muted-foreground mb-1">{expense.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="text-lg font-bold text-primary">
                                                    ৳{parseFloat(expense.amount).toFixed(2)}
                                                </p>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        icon={<Edit size={16} />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit(expense);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        icon={<Trash2 size={16} />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(expense);
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            ))}
        </div>
    );
};

export default PersonalExpenseList;
