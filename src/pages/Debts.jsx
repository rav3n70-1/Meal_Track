// Debts page - manage personal debts and IOUs with approval system
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Plus, CheckCircle, AlertCircle, Info } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import StatsCard from '../components/Dashboard/StatsCard';
import PendingDebtApprovals from '../components/Debts/PendingDebtApprovals';
import Modal from '../components/ui/Modal';
import DebtForm from '../components/Debts/DebtForm';
import MemberDebtCard from '../components/Debts/MemberDebtCard';
import DebtBreakdownModal from '../components/Debts/DebtBreakdownModal';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import { calculateBalances } from '../utils/calculations';
import Loading from '../components/ui/Loading';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import DebtPaymentForm from '../components/Debts/DebtPaymentForm';

// Custom Taka Icon Component
const TakaIcon = ({ size = 24 }) => (
  <span style={{ fontSize: `${size}px`, fontWeight: 'bold' }}>৳</span>
);

const Debts = () => {
  const { currentUser } = useAuth();
  const { debts, loading, getUserRole, members, expenses } = useHousehold();
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [debtToSettle, setDebtToSettle] = useState(null);
  const role = getUserRole();

  // Calculate balances and stats
  const { memberBalances, grandTotal } = useMemo(() => {
    return calculateBalances(expenses, members, debts);
  }, [expenses, members, debts]);

  const debtStats = useMemo(() => {
    const approvedDebts = debts.filter(debt => debt.status === 'approved');
    const pendingDebts = debts.filter(debt => debt.status === 'pending');
    const activeDebts = approvedDebts.filter(debt => debt.remainingAmount > 0);
    const paidDebts = debts.filter(debt => debt.status === 'paid' || debt.remainingAmount === 0);

    // Separate auto and manual debts
    const activeAutoDebts = activeDebts.filter(debt => debt.type === 'auto');
    const activeManualDebts = activeDebts.filter(debt => debt.type === 'manual');

    // Calculate debts where current user is debtor (owes money)
    const myDebts = activeDebts.filter(debt => debt.debtor === currentUser?.uid);
    const totalIOwe = myDebts.reduce((sum, debt) => sum + parseFloat(debt.remainingAmount || 0), 0);

    // Calculate debts where current user is creditor (owed money)
    const debtsToMe = activeDebts.filter(debt => debt.creditor === currentUser?.uid);
    const totalOwedToMe = debtsToMe.reduce((sum, debt) => sum + parseFloat(debt.remainingAmount || 0), 0);

    // Total active debt amount (sum of all remaining amounts)
    const totalActiveDebt = activeDebts.reduce((sum, debt) => sum + parseFloat(debt.remainingAmount || 0), 0);

    return {
      active: activeDebts.length,
      paid: paidDebts.length,
      totalIOwe,
      totalOwedToMe,
      totalActiveDebt,
      autoCount: activeAutoDebts.length,
      manualCount: activeManualDebts.length,
      pendingManual: pendingDebts.length,
    };
  }, [debts, currentUser]);

  const handleMemberClick = (member) => {
    setSelectedMember(member);
  };

  const handleSettleDebt = (debt) => {
    setDebtToSettle(debt);
    // Keep the breakdown modal open underneath
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="Loading debts..." />
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
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">Debt Management</h1>
            <p className="text-muted-foreground">
              {role === 'manager'
                ? 'Track all money owed between household members'
                : 'Track your debts and money owed to you'}
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Auto Debts"
            value={debtStats.autoCount}
            icon={DollarSign}
            color="primary"
          />
          <StatsCard
            title="Manual Debts"
            value={debtStats.manualCount}
            icon={DollarSign}
            color="warning"
          />
          <StatsCard
            title="Pending Approval"
            value={debtStats.pendingManual}
            icon={AlertCircle}
            color="warning"
          />
          <StatsCard
            title="Fully Paid"
            value={debtStats.paid}
            icon={CheckCircle}
            color="success"
          />
          <StatsCard
            title="Total Debt"
            value={`৳${debtStats.totalActiveDebt.toFixed(2)}`}
            icon={TakaIcon}
            color="primary"
          />
        </div>

        {/* My Debt Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Money I Owe */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/20 rounded-lg p-6 shadow-lg"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="text-red-500" size={20} />
                  I Owe
                </h3>
              </div>
              <motion.div
                className="text-3xl font-bold text-red-600 dark:text-red-400"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                ৳{debtStats.totalIOwe.toFixed(2)}
              </motion.div>
              <p className="text-sm text-muted-foreground">
                {debtStats.totalIOwe > 0
                  ? 'Money you need to pay back'
                  : 'You don\'t owe anyone! 🎉'}
              </p>
            </div>
          </motion.div>

          {/* Money Owed to Me */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 rounded-lg p-6 shadow-lg"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={20} />
                  Owed to Me
                </h3>
              </div>
              <motion.div
                className="text-3xl font-bold text-green-600 dark:text-green-400"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                ৳{debtStats.totalOwedToMe.toFixed(2)}
              </motion.div>
              <p className="text-sm text-muted-foreground">
                {debtStats.totalOwedToMe > 0
                  ? 'Money others will pay you'
                  : 'No one owes you money'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Manager-specific: Pending Debt Approvals */}
        {role === 'manager' && (
          <PendingDebtApprovals debts={debts} />
        )}

        {/* Member Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Info size={20} className="text-primary" />
            Member Balances
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(member => (
              <MemberDebtCard
                key={member.uid}
                member={member}
                balanceData={memberBalances[member.uid]}
                onClick={() => handleMemberClick(member)}
              />
            ))}
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle size={20} />
              How Debt Tracking Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">Automatic Debts (from Expenses):</p>
              <p>• <strong>Auto-Generated:</strong> Created automatically when expenses are approved</p>
              <p>• <strong>Pairwise Calculation:</strong> Debts are calculated directly between the payer and the consumer</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Manual Debts (Personal IOUs):</p>
              <p>• <strong>Create Manually:</strong> Use the "+" button to record personal loans between members</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Payment & Balance:</p>
              <p>• <strong>Track Payments:</strong> Record payments as they are made to reduce any debt</p>
              <p>• <strong>Click a Member:</strong> Click on any member card above to see detailed breakdown and settle debts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Add Debt Button */}
      <motion.button
        onClick={() => setShowAddDebt(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-50 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      </motion.button>

      {/* Add Debt Modal */}
      <Modal
        isOpen={showAddDebt}
        onClose={() => setShowAddDebt(false)}
        title="Add New Debt Record"
        size="lg"
      >
        <DebtForm
          onSuccess={() => setShowAddDebt(false)}
          onCancel={() => setShowAddDebt(false)}
        />
      </Modal>

      {/* Debt Breakdown Modal */}
      <DebtBreakdownModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        debts={debts}
        expenses={expenses}
        members={members}
        onSettle={handleSettleDebt}
        currentUserId={currentUser?.uid}
      />

      {/* Settle Debt Modal (Payment Form) */}
      <Modal
        isOpen={!!debtToSettle}
        onClose={() => setDebtToSettle(null)}
        title="Record Debt Payment"
        size="md"
      >
        {debtToSettle && (
          <DebtPaymentForm
            debt={debtToSettle}
            onSuccess={() => setDebtToSettle(null)}
            onCancel={() => setDebtToSettle(null)}
          />
        )}
      </Modal>
    </Layout>
  );
};

export default Debts;

