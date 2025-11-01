// Analytics and Trends Page
import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout/Layout';
import { useHousehold } from '../context/HouseholdContext';
import { getCategoryLabel } from '../utils/categories';
import { getDisplayName } from '../utils/displayName';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const Analytics = () => {
  const { expenses, members } = useHousehold();
  const [timeRange, setTimeRange] = useState('month'); // week, month, quarter, year
  const [viewType, setViewType] = useState('category'); // category, member, time

  // Filter expenses by time range
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        break;
    }

    return expenses.filter(expense => {
      if (expense.status !== 'approved') return false;
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= now;
    });
  }, [expenses, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => 
      sum + (parseFloat(exp.totalAmount) || parseFloat(exp.amount) || 0), 0
    );
    const average = filteredExpenses.length > 0 ? total / filteredExpenses.length : 0;
    const count = filteredExpenses.length;

    // Calculate trend (compare with previous period)
    const periodDays = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };

    const days = periodDays[timeRange] || 30;
    const previousStart = new Date();
    previousStart.setDate(previousStart.getDate() - (days * 2));
    const previousEnd = new Date();
    previousEnd.setDate(previousEnd.getDate() - days);

    const previousExpenses = expenses.filter(expense => {
      if (expense.status !== 'approved') return false;
      const expenseDate = new Date(expense.date);
      return expenseDate >= previousStart && expenseDate <= previousEnd;
    });

    const previousTotal = previousExpenses.reduce((sum, exp) => 
      sum + (parseFloat(exp.totalAmount) || parseFloat(exp.amount) || 0), 0
    );

    const trend = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

    return { total, average, count, trend };
  }, [filteredExpenses, expenses, timeRange]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const categories = {};
    filteredExpenses.forEach(expense => {
      const category = expense.category || 'other';
      const amount = parseFloat(expense.totalAmount) || parseFloat(expense.amount) || 0;
      categories[category] = (categories[category] || 0) + amount;
    });

    return Object.entries(categories).map(([category, amount]) => ({
      name: getCategoryLabel(category),
      value: Math.round(amount * 100) / 100,
      category
    })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Member breakdown
  const memberData = useMemo(() => {
    const memberSpending = {};
    filteredExpenses.forEach(expense => {
      const sharePerPerson = (parseFloat(expense.totalAmount) || parseFloat(expense.amount) || 0) / (expense.sharedAmong?.length || 1);
      expense.sharedAmong?.forEach(memberId => {
        memberSpending[memberId] = (memberSpending[memberId] || 0) + sharePerPerson;
      });
    });

    return Object.entries(memberSpending).map(([memberId, amount]) => {
      const member = members.find(m => m.uid === memberId);
      return {
        name: getDisplayName(member),
        value: Math.round(amount * 100) / 100
      };
    }).sort((a, b) => b.value - a.value);
  }, [filteredExpenses, members]);

  // Time series data
  const timeSeriesData = useMemo(() => {
    const grouped = {};
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date);
      let key;

      if (timeRange === 'week') {
        key = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (timeRange === 'month') {
        key = date.getDate();
      } else if (timeRange === 'quarter') {
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `Week ${weekNum}`;
      } else {
        key = date.toLocaleDateString('en-US', { month: 'short' });
      }

      const amount = parseFloat(expense.totalAmount) || parseFloat(expense.amount) || 0;
      grouped[key] = (grouped[key] || 0) + amount;
    });

    return Object.entries(grouped).map(([name, amount]) => ({
      name,
      amount: Math.round(amount * 100) / 100
    }));
  }, [filteredExpenses, timeRange]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

  return (
    <Layout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Trends</h1>
          <p className="text-muted-foreground">Insights into your spending patterns</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            options={[
              { value: 'week', label: 'Last 7 Days' },
              { value: 'month', label: 'Last 30 Days' },
              { value: 'quarter', label: 'Last 3 Months' },
              { value: 'year', label: 'Last Year' }
            ]}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <DollarSign className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spending</p>
              <p className="text-2xl font-bold">৳{stats.total.toFixed(0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Target className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-2xl font-bold">৳{stats.average.toFixed(0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Calendar className="text-purple-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold">{stats.count}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stats.trend >= 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              {stats.trend >= 0 ? (
                <TrendingUp className="text-red-500" size={24} />
              ) : (
                <TrendingDown className="text-green-500" size={24} />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trend</p>
              <p className={`text-2xl font-bold ${stats.trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `৳${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Member Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Spending by Member</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={memberData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `৳${value.toFixed(2)}`} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Time Series */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Spending Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `৳${value.toFixed(2)}`} />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Categories */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
        <div className="space-y-3">
          {categoryData.slice(0, 5).map((category, index) => {
            const percentage = (category.value / stats.total) * 100;
            return (
              <div key={category.category}>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="font-medium">{category.name}</span>
                  <span>৳{category.value.toFixed(0)} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      </div>
    </Layout>
  );
};

export default Analytics;

