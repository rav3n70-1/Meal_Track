// Main dashboard page with different views for manager and members
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, TrendingUp, Users, Plus } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import StatsCard from '../components/Dashboard/StatsCard';
import PendingApprovals from '../components/Dashboard/PendingApprovals';
import BalanceChart from '../components/Dashboard/BalanceChart';
import ExpenseChart from '../components/Dashboard/ExpenseChart';
import BalanceSummary from '../components/Dashboard/BalanceSummary';
import Modal from '../components/ui/Modal';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { calculateBalances, getExpenseStats } from '../utils/calculations';
import Loading from '../components/ui/Loading';

// Custom Taka Icon Component
const TakaIcon = ({ size = 24 }) => (
  <span style={{ fontSize: `${size}px`, fontWeight: 'bold' }}>৳</span>
);

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { household, members, expenses, loading, getUserRole } = useHousehold();
  const { t } = useLanguage();
  const role = getUserRole();
  const [showAddExpense, setShowAddExpense] = useState(false);

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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">{t('dashboard')}</h1>
          <p className="text-muted-foreground">
            {t('welcomeBack')}, {currentUser?.displayName}!
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={t('totalExpenses')}
            value={`৳${grandTotal.toFixed(2)}`}
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
              <div>
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    ৳
                  </motion.span>
                  {t('myBalance')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('youvePaid')} ৳{myBalance.totalPaid.toFixed(2)} • {t('yourShare')} ৳{myBalance.totalShare.toFixed(2)}
                </p>
              </div>
              <motion.div 
                className="text-3xl font-bold"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {myBalance.balance >= 0 ? (
                  <span className="text-green-600 dark:text-green-400">
                    +৳{myBalance.balance.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    ৳{myBalance.balance.toFixed(2)}
                  </span>
                )}
              </motion.div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {myBalance.balance > 0 
                ? t('othersOweYou')
                : myBalance.balance < 0 
                ? t('youOweOthers')
                : t('allSettled')}
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
    </Layout>
  );
};

export default Dashboard;

