import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const PersonalExpenseCharts = ({ expenses }) => {

    const categoryData = useMemo(() => {
        const map = {};
        expenses.forEach(expense => {
            const cat = expense.category;
            if (!map[cat]) map[cat] = 0;
            map[cat] += parseFloat(expense.amount || 0);
        });

        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [expenses]);

    const dailyTrendData = useMemo(() => {
        const map = {};
        // Get last 7 days
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            map[dateStr] = 0;
        }

        expenses.forEach(expense => {
            const date = expense.date;
            if (map.hasOwnProperty(date)) {
                map[date] += parseFloat(expense.amount || 0);
            }
        });

        return Object.entries(map).map(([date, amount]) => ({
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            amount
        }));
    }, [expenses]);

    if (expenses.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip formatter={(value) => `৳${value.toFixed(2)}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Last 7 Days Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyTrendData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="date" className="text-xs" tick={{ fill: 'currentColor' }} />
                            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                formatter={(value) => [`৳${value.toFixed(2)}`, 'Amount']}
                            />
                            <Bar dataKey="amount" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default PersonalExpenseCharts;
