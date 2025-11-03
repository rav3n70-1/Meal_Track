// Main Rent and Bills page
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, DollarSign, Users, TrendingUp, Receipt, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import StatsCard from '../components/Dashboard/StatsCard';
import RentBillForm from '../components/RentBills/RentBillForm';
import RentBillList from '../components/RentBills/RentBillList';
import RentBillCalendar from '../components/RentBills/RentBillCalendar';
import RentBillMembers from '../components/RentBills/RentBillMembers';
import Loading from '../components/ui/Loading';
import { useRentBills } from '../context/RentBillsContext';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';

const RentBills = () => {
  const { currentUser } = useAuth();
  const { getUserRole } = useHousehold();
  const { loading, getStats, rentBills } = useRentBills();
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [activeTab, setActiveTab] = useState('bills'); // 'bills' or 'members'

  const role = getUserRole();
  const isManager = role === 'manager';
  const allStats = getStats();

  // Calculate member-specific stats
  const stats = useMemo(() => {
    if (isManager) {
      return allStats;
    }

    // Calculate stats only for current member's bills
    let memberTotalAmount = 0;
    let memberTotalPaid = 0;
    let memberUnpaidCount = 0;
    let memberTotalBills = 0;

    rentBills.forEach(bill => {
      // Check if member is in this bill
      const isMemberInBill = bill.memberBreakdown?.some(m => m.memberId === currentUser?.uid);
      
      if (isMemberInBill && bill.memberCategoryAmounts?.[currentUser?.uid]) {
        let billTotal = 0;
        let billPaid = 0;
        
        Object.entries(bill.memberCategoryAmounts[currentUser.uid]).forEach(([category, amount]) => {
          billTotal += parseFloat(amount) || 0;
          billPaid += parseFloat(bill.memberCategoryPayments?.[currentUser.uid]?.[category]) || 0;
        });
        
        memberTotalAmount += billTotal;
        memberTotalPaid += billPaid;
        memberTotalBills += 1;
        
        if (billPaid < billTotal) {
          memberUnpaidCount += 1;
        }
      }
    });

    return {
      totalAmount: memberTotalAmount,
      totalPaid: memberTotalPaid,
      totalUnpaid: memberTotalAmount - memberTotalPaid,
      unpaidCount: memberUnpaidCount,
      partialCount: 0,
      paidCount: memberTotalBills - memberUnpaidCount,
      totalBills: memberTotalBills
    };
  }, [isManager, allStats, rentBills, currentUser]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="Loading rent and bills..." />
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
          <h1 className="text-3xl font-bold mb-2">Rent & Bills</h1>
          <p className="text-muted-foreground">
            {isManager
              ? 'Manage rent and bills for all members'
              : 'View rent and bills information'}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Amount"
            value={`৳${stats.totalAmount.toFixed(2)}`}
            icon={DollarSign}
            color="primary"
          />
          <StatsCard
            title="Total Paid"
            value={`৳${stats.totalPaid.toFixed(2)}`}
            icon={TrendingUp}
            color="success"
          />
          <StatsCard
            title="Unpaid"
            value={stats.unpaidCount}
            icon={AlertCircle}
            color="danger"
          />
          <StatsCard
            title="Total Bills"
            value={stats.totalBills}
            icon={Receipt}
            color="primary"
          />
        </div>

        {/* Tabs - Only show to managers */}
        {isManager && (
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab('bills')}
              className={`px-4 py-2 font-medium transition-colors relative ${
                activeTab === 'bills'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Bills
              {activeTab === 'bills' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 font-medium transition-colors relative ${
                activeTab === 'members'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Members
              {activeTab === 'members' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          </div>
        )}

        {/* Content */}
        {activeTab === 'bills' ? (
          <div className="space-y-6">
            <RentBillList />
            {isManager && (
              <div>
                <RentBillCalendar />
              </div>
            )}
          </div>
        ) : (
          <RentBillMembers />
        )}

        {/* Floating Add Bill Button - Only for managers */}
        {isManager && activeTab === 'bills' && (
          <motion.button
            onClick={() => setShowAddBillModal(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-50 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
          </motion.button>
        )}

        {/* Add Bill Modal */}
        <Modal
          isOpen={showAddBillModal}
          onClose={() => setShowAddBillModal(false)}
          title="Add New Bill"
          size="lg"
        >
          <RentBillForm
            onSuccess={() => setShowAddBillModal(false)}
            onCancel={() => setShowAddBillModal(false)}
          />
        </Modal>
      </div>
    </Layout>
  );
};

export default RentBills;

