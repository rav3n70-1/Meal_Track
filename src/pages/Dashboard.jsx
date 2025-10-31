// Main dashboard page with different views for manager and members
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Receipt, TrendingUp, Users } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import StatsCard from '../components/Dashboard/StatsCard';
import PendingApprovals from '../components/Dashboard/PendingApprovals';
import BalanceChart from '../components/Dashboard/BalanceChart';
import ExpenseChart from '../components/Dashboard/ExpenseChart';
import BalanceSummary from '../components/Dashboard/BalanceSummary';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import { calculateBalances, getExpenseStats } from '../utils/calculations';
import Loading from '../components/ui/Loading';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { household, members, expenses, loading, getUserRole } = useHousehold();
  const role = getUserRole();

  // Calculate statistics
  const stats = useMemo(() => {
    return getExpenseStats(expenses);
  }, [expenses]);

  // Calculate balances
  const { grandTotal, memberBalances } = useMemo(() => {
    return calculateBalances(expenses, members);
  }, [expenses, members]);

  // Get current user's balance
  const myBalance = useMemo(() => {
    return memberBalances[currentUser?.uid] || null;
  }, [memberBalances, currentUser]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="Loading dashboard..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.displayName}!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Expenses"
            value={`$${grandTotal.toFixed(2)}`}
            icon={DollarSign}
            color="primary"
          />
          <StatsCard
            title="Approved"
            value={stats.totalApproved}
            icon={Receipt}
            color="success"
          />
          <StatsCard
            title="Pending"
            value={stats.totalPending}
            icon={TrendingUp}
            color="warning"
          />
          <StatsCard
            title="Members"
            value={members.length}
            icon={Users}
            color="primary"
          />
        </div>

        {/* My Balance Card */}
        {myBalance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-lg p-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Your Balance</h3>
                <p className="text-sm text-muted-foreground">
                  You've paid ${myBalance.totalPaid.toFixed(2)} • Your share is ${myBalance.totalShare.toFixed(2)}
                </p>
              </div>
              <div className="text-3xl font-bold">
                {myBalance.balance >= 0 ? (
                  <span className="text-green-600 dark:text-green-400">
                    +${myBalance.balance.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    ${myBalance.balance.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {myBalance.balance > 0 
                ? 'Others owe you money' 
                : myBalance.balance < 0 
                ? 'You owe others money'
                : 'You\'re all settled up!'}
            </p>
          </motion.div>
        )}

        {/* Manager-specific: Pending Approvals */}
        {role === 'manager' && (
          <PendingApprovals expenses={expenses} />
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BalanceChart balances={memberBalances} />
          <ExpenseChart expenses={expenses} />
        </div>

        {/* Balance Summary */}
        <BalanceSummary balances={memberBalances} />
      </div>
    </Layout>
  );
};

export default Dashboard;

