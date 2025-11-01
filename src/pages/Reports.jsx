// Reports page with detailed analytics and export functionality
import React, { useMemo, useState } from 'react';
import { Download, TrendingUp, Calendar } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import BalanceChart from '../components/Dashboard/BalanceChart';
import ExpenseChart from '../components/Dashboard/ExpenseChart';
import { useHousehold } from '../context/HouseholdContext';
import { calculateBalances, filterExpensesByDate, getExpenseStats } from '../utils/calculations';
import { exportToExcel, exportToCSV, exportBalancesToExcel } from '../utils/exportData';
import { calculateDebts } from '../utils/calculations';
import Loading from '../components/ui/Loading';
import toast from 'react-hot-toast';

const Reports = () => {
  const { expenses, members, debts, loading } = useHousehold();
  const [dateRange, setDateRange] = useState('all');

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    return filterExpensesByDate(expenses, dateRange);
  }, [expenses, dateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    return getExpenseStats(filteredExpenses);
  }, [filteredExpenses]);

  // Calculate balances (including debts - debts are not filtered by date)
  const { grandTotal, memberBalances } = useMemo(() => {
    return calculateBalances(filteredExpenses, members, debts);
  }, [filteredExpenses, members, debts]);

  // Calculate settlement debts (who owes whom)
  const settlementDebts = useMemo(() => {
    return calculateDebts(memberBalances);
  }, [memberBalances]);

  const handleExportExpenses = (format) => {
    try {
      if (format === 'excel') {
        exportToExcel(filteredExpenses, members);
      } else {
        exportToCSV(filteredExpenses, members);
      }
      toast.success(`Expenses exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export expenses');
    }
  };

  const handleExportBalances = () => {
    try {
      exportBalancesToExcel(memberBalances, settlementDebts);
      toast.success('Balances exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export balances');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="Loading reports..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Reports</h1>
            <p className="text-muted-foreground">
              Detailed analytics and expense reports
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Download size={18} />}
              onClick={() => handleExportExpenses('excel')}
            >
              Export Excel
            </Button>
            <Button
              variant="outline"
              icon={<Download size={18} />}
              onClick={() => handleExportExpenses('csv')}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-muted-foreground" size={20} />
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'Last 30 Days' },
                { value: 'year', label: 'Last Year' }
              ]}
              className="flex-1 max-w-xs"
            />
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-primary">
                ${grandTotal.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.totalApproved}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Average</p>
              <p className="text-3xl font-bold">
                ${stats.averageAmount.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.totalPending}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BalanceChart balances={memberBalances} />
          <ExpenseChart expenses={filteredExpenses} />
        </div>

        {/* Member Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Member Breakdown</CardTitle>
              <Button
                variant="outline"
                size="sm"
                icon={<Download size={16} />}
                onClick={handleExportBalances}
              >
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2">Member</th>
                    <th className="text-right py-3 px-2">Total Paid</th>
                    <th className="text-right py-3 px-2">Total Share</th>
                    <th className="text-right py-3 px-2">Balance</th>
                    <th className="text-right py-3 px-2">Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(memberBalances).map((member) => (
                    <tr key={member.email} className="border-b border-border">
                      <td className="py-3 px-2 font-medium">{member.name}</td>
                      <td className="text-right py-3 px-2">
                        ${member.totalPaid.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-2">
                        ${member.totalShare.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className={member.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {member.balance >= 0 ? '+' : ''}${member.balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-2">
                        {member.expenseCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;

