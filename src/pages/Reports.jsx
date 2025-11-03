// Reports page with detailed analytics and export functionality
import React, { useMemo, useState } from 'react';
import { Download, TrendingUp, Calendar } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { Navigate } from 'react-router-dom';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import BalanceChart from '../components/Dashboard/BalanceChart';
import ExpenseChart from '../components/Dashboard/ExpenseChart';
import { useHousehold } from '../context/HouseholdContext';
import { useRentBills } from '../context/RentBillsContext';
import { calculateBalances, filterExpensesByDate, getExpenseStats, getContributionsByMember } from '../utils/calculations';
import { getDisplayName } from '../utils/displayName';
// Exports removed per requirement
import { calculateDebts } from '../utils/calculations';
import Loading from '../components/ui/Loading';
import toast from 'react-hot-toast';

const Reports = () => {
  const { expenses, members, debts, loading, getUserRole } = useHousehold();
  const { rentBills } = useRentBills();
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

  // Member Contributions chart (match main dashboard logic): include non-rejected expenses and debt repayments
  const nonRejectedFilteredExpenses = useMemo(() => {
    return filteredExpenses.filter(exp => exp.status !== 'rejected');
  }, [filteredExpenses]);

  const contributionsForChart = useMemo(() => {
    return getContributionsByMember(nonRejectedFilteredExpenses, members, debts);
  }, [nonRejectedFilteredExpenses, members, debts]);

  // Map of userId -> display name for debts table
  const userIdToName = useMemo(() => {
    const map = {};
    members.forEach(m => {
      map[m.uid] = getDisplayName(m);
    });
    return map;
  }, [members]);

  // Rent & Bills aggregates (exclude personal expenses by design)
  const rentSummary = useMemo(() => {
    const totalAmount = rentBills.reduce((s, b) => s + (b.totalAmount || 0), 0);
    const paidAmount = rentBills.reduce((s, b) => s + (b.paidAmount || 0), 0);
    const unpaidAmount = totalAmount - paidAmount;
    // Per-member totals from memberCategoryAmounts and payments
    const perMember = {};
    members.forEach(m => {
      perMember[m.uid] = { name: m.name || m.email, total: 0, paid: 0 };
    });
    rentBills.forEach(bill => {
      const mca = bill.memberCategoryAmounts || {};
      const mcp = bill.memberCategoryPayments || {};
      Object.keys(mca).forEach(memberId => {
        const totals = Object.values(mca[memberId] || {}).reduce((s, a) => s + (parseFloat(a) || 0), 0);
        perMember[memberId] = perMember[memberId] || { name: memberId, total: 0, paid: 0 };
        perMember[memberId].total += totals;
      });
      Object.keys(mcp).forEach(memberId => {
        const paid = Object.values(mcp[memberId] || {}).reduce((s, a) => s + (parseFloat(a) || 0), 0);
        perMember[memberId] = perMember[memberId] || { name: memberId, total: 0, paid: 0 };
        perMember[memberId].paid += paid;
      });
    });
    return { totalAmount, paidAmount, unpaidAmount, perMember };
  }, [rentBills, members]);

  // Export actions removed

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="Loading reports..." />
        </div>
      </Layout>
    );
  }

  const role = getUserRole();
  if (role !== 'manager') {
    return <Navigate to="/dashboard" replace />;
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
        {/* Export buttons removed */}
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
                ৳{grandTotal.toFixed(2)}
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
                ৳{stats.averageAmount.toFixed(2)}
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
          <BalanceChart balances={contributionsForChart} />
          <ExpenseChart expenses={nonRejectedFilteredExpenses} />
        </div>

        {/* Rent & Bills Summary (excludes personal expenses) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Rent/Bills Total</p>
              <p className="text-3xl font-bold">৳{rentSummary.totalAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Rent/Bills Paid</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">৳{rentSummary.paidAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Rent/Bills Unpaid</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">৳{rentSummary.unpaidAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Rent & Bills Breakdown by Member */}
        <Card>
          <CardHeader>
            <CardTitle>Rent & Bills Breakdown (by Member)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2">Member</th>
                    <th className="text-right py-3 px-2">Total</th>
                    <th className="text-right py-3 px-2">Paid</th>
                    <th className="text-right py-3 px-2">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(rentSummary.perMember).map(([memberId, data]) => {
                    const remaining = Math.max(0, (data.total || 0) - (data.paid || 0));
                    return (
                      <tr key={memberId} className="border-b border-border">
                        <td className="py-3 px-2 font-medium">{data.name}</td>
                        <td className="text-right py-3 px-2">৳{(data.total || 0).toFixed(2)}</td>
                        <td className="text-right py-3 px-2 text-green-600 dark:text-green-400">৳{(data.paid || 0).toFixed(2)}</td>
                        <td className="text-right py-3 px-2 text-red-600 dark:text-red-400">৳{remaining.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Debts Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Active Debts</p>
              <p className="text-3xl font-bold">{debts.filter(d => d.status === 'approved' && (d.remainingAmount || 0) > 0).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Remaining</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">৳{debts.reduce((s, d) => s + (d.status === 'approved' ? (parseFloat(d.remainingAmount) || 0) : 0), 0).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Original</p>
              <p className="text-3xl font-bold">৳{debts.reduce((s, d) => s + (d.status === 'approved' ? (parseFloat(d.originalAmount) || 0) : 0), 0).toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Debts Detail Table */}
        <Card>
          <CardHeader>
            <CardTitle>Debts Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2">Debtor</th>
                    <th className="text-left py-3 px-2">Creditor</th>
                    <th className="text-right py-3 px-2">Original</th>
                    <th className="text-right py-3 px-2">Remaining</th>
                    <th className="text-left py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map((d, idx) => (
                    <tr key={idx} className="border-b border-border">
                      <td className="py-3 px-2">{d.debtorName || userIdToName[d.debtor] || d.debtor}</td>
                      <td className="py-3 px-2">{d.creditorName || userIdToName[d.creditor] || d.creditor}</td>
                      <td className="text-right py-3 px-2">৳{(parseFloat(d.originalAmount) || 0).toFixed(2)}</td>
                      <td className="text-right py-3 px-2">৳{(parseFloat(d.remainingAmount) || 0).toFixed(2)}</td>
                      <td className="py-3 px-2 capitalize">{d.status || 'approved'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Member Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Member Breakdown</CardTitle>
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
                        ৳{member.totalPaid.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-2">
                        ৳{member.totalShare.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className={member.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {member.balance >= 0 ? '+' : ''}৳{member.balance.toFixed(2)}
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

