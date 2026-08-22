// Main dashboard page with different views for manager and members
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, TrendingUp, Users, Plus, Info } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import StatsCard from '../components/Dashboard/StatsCard';
import PendingApprovals from '../components/Dashboard/PendingApprovals';
import BalanceChart from '../components/Dashboard/BalanceChart';
import ExpenseChart from '../components/Dashboard/ExpenseChart';
import BalanceSummary from '../components/Dashboard/BalanceSummary';
import BalanceDetailsModal from '../components/Dashboard/BalanceDetailsModal';
import RentBillSummary from '../components/Dashboard/RentBillSummary';
import NoticeBoard from '../components/Dashboard/NoticeBoard';
import Modal from '../components/ui/Modal';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import Button from '../components/ui/Button';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { calculateBalances, getExpenseStats, getExpenseTotalAmount, getContributionsByMember } from '../utils/calculations';
import Loading from '../components/ui/Loading';

// Custom Taka Icon Component
const TakaIcon = ({ size = 24 }) => (
  <span style={{ fontSize: `${size}px`, fontWeight: 'bold' }}>৳</span>
);

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { household, members, expenses, debts, loading, getUserRole } = useHousehold();
  const { t } = useLanguage();
  const role = getUserRole();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    return getExpenseStats(expenses);
  }, [expenses]);

  // Approved expenses only for charts and calculations
  const approvedExpenses = useMemo(() => {
    return expenses.filter(exp => exp.status === 'approved');
  }, [expenses]);

  // Display total should only include approved expenses (pending expenses are not counted until approved)
  const displayTotal = useMemo(() => {
    return approvedExpenses.reduce((sum, exp) => sum + getExpenseTotalAmount(exp), 0);
  }, [approvedExpenses]);

  // Calculate balances (including debts)
  const { grandTotal, memberBalances } = useMemo(() => {
    return calculateBalances(expenses, members, debts);
  }, [expenses, members, debts]);

  // Member contributions chart should only reflect approved expenses and debt repayments
  const contributionsForChart = useMemo(() => {
    return getContributionsByMember(approvedExpenses, members, debts);
  }, [approvedExpenses, members, debts]);

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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">{t('dashboard')}</h1>
          <p className="text-muted-foreground">
            {t('welcomeBack')}, {currentUser?.displayName}!
          </p>
        </motion.div>

        {/* Notice Board */}
        <NoticeBoard />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={t('totalExpenses')}
            value={`৳${displayTotal.toFixed(2)}`}
            icon={TakaIcon}
            color="primary"
          />
          <StatsCard
            title={t('approved')}
            value={stats.totalApproved}
            icon={Receipt}
            color="success"
          />
          <StatsCard
            title={t('pending')}
            value={stats.totalPending}
            icon={TrendingUp}
            color="warning"
          />
          <StatsCard
            title={t('members')}
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
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-lg p-6 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    ৳
                  </motion.span>
                  {t('myBalance')}
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {myBalance.totalDebtOwed > 0 ? (
                    <p className="flex items-center gap-2">
                      <span className="text-red-600 dark:text-red-400">
                        You owe: ৳{myBalance.totalDebtOwed.toFixed(2)}
                      </span>
                    </p>
                  ) : (
                    <p className="text-muted-foreground">No active debts</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <motion.div
                  className="text-3xl font-bold"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {myBalance.totalDebtOwed > 0 ? (
                    <span className="text-red-600 dark:text-red-400">
                      -৳{myBalance.totalDebtOwed.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400">
                      ৳0.00
                    </span>
                  )}
                </motion.div>
                <Button
                  onClick={() => setShowBalanceDetails(true)}
                  variant="outline"
                  size="sm"
                  icon={<Info size={16} />}
                >
                  View Details
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {myBalance.totalDebtOwed > 0
                ? 'You have unsettled debts'
                : 'All your debts are settled!'}
            </p>
          </motion.div>
        )}

        {/* Manager-specific: Pending Approvals */}
        {role === 'manager' && (
          <PendingApprovals expenses={expenses} />
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BalanceChart balances={contributionsForChart} />
          <ExpenseChart expenses={approvedExpenses} />
        </div>

        {/* Balance Summary */}
        <BalanceSummary balances={memberBalances} />

        {/* Rent & Bills Summary */}
        <RentBillSummary />
      </div>

      {/* Floating Add Expense Button */}
      <motion.button
        onClick={() => setShowAddExpense(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-50 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      </motion.button>

      {/* Add Expense Modal */}
      <Modal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        title="Add New Expense"
        size="lg"
      >
        <ExpenseForm
          onSuccess={() => setShowAddExpense(false)}
          onCancel={() => setShowAddExpense(false)}
        />
      </Modal>

      {/* Balance Details Modal */}
      {myBalance && (
        <BalanceDetailsModal
          isOpen={showBalanceDetails}
          onClose={() => setShowBalanceDetails(false)}
          balance={myBalance}
          userName={currentUser?.displayName || 'You'}
        />
      )}
    </Layout>
  );
}

export default Dashboard;

