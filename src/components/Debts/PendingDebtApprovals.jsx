// Component for managers to review and approve pending debt records
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { getDisplayName } from '../../utils/displayName';
import toast from 'react-hot-toast';

const PendingDebtApprovals = ({ debts }) => {
  const { currentUser } = useAuth();
  const { household, members, getUserRole } = useHousehold();
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const role = getUserRole();

  // Only show manual debts that are pending (auto debts don't need approval)
  const pendingDebts = debts.filter(debt => debt.status === 'pending' && debt.type === 'manual');

  // Create member lookup
  const memberLookup = {};
  members.forEach(member => {
    memberLookup[member.uid] = member;
  });

  const handleApprove = async (debt) => {
    if (role !== 'manager') {
      toast.error('Only managers can approve debt records');
      return;
    }

    setLoading(true);
    try {
      const debtRef = doc(db, 'households', household.id, 'debts', debt.id);
      await updateDoc(debtRef, {
        status: 'approved',
        approvedBy: currentUser.uid,
        approvedAt: new Date().toISOString()
      });

      toast.success('Debt record approved!');
      setShowDetailsModal(false);
      setSelectedDebt(null);
    } catch (error) {
      toast.error('Failed to approve debt record');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (debt) => {
    if (role !== 'manager') {
      toast.error('Only managers can reject debt records');
      return;
    }

    setLoading(true);
    try {
      const debtRef = doc(db, 'households', household.id, 'debts', debt.id);
      await updateDoc(debtRef, {
        status: 'rejected',
        approvedBy: currentUser.uid,
        approvedAt: new Date().toISOString()
      });

      toast.success('Debt record rejected');
      setShowDetailsModal(false);
      setSelectedDebt(null);
    } catch (error) {
      toast.error('Failed to reject debt record');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (debt) => {
    setSelectedDebt(debt);
    setShowDetailsModal(true);
  };

  if (pendingDebts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={24} />
            Pending Manual Debt Approvals
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No pending manual debt approvals</p>
          <p className="text-xs text-muted-foreground mt-2">
            (Automatic debts from expenses don't require approval)
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="text-yellow-500" size={24} />
            Pending Manual Debt Approvals ({pendingDebts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingDebts.map((debt, index) => {
            const debtor = memberLookup[debt.debtor];
            const creditor = memberLookup[debt.creditor];

            return (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {getDisplayName(debtor)}
                    </span>
                    <ArrowRight className="text-muted-foreground" size={18} />
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {getDisplayName(creditor)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{debt.reason}</span>
                    <span className="font-bold text-primary text-lg">
                      ৳{debt.originalAmount.toFixed(2)}
                    </span>
                  </div>
                  {debt.notes && (
                    <p className="text-xs text-muted-foreground">{debt.notes}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    {format(new Date(debt.date), 'MMM dd, yyyy')}
                  </div>
                </div>

                {/* Actions */}
                {role === 'manager' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(debt)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(debt)}
                      disabled={loading}
                      icon={<XCircle size={16} />}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(debt)}
                      disabled={loading}
                      icon={<CheckCircle size={16} />}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDebt(null);
        }}
        title="Debt Record Details"
        size="md"
      >
        {selectedDebt && (
          <div className="space-y-4">
            <div className="bg-accent rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Debtor:</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {getDisplayName(memberLookup[selectedDebt.debtor])}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Creditor:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {getDisplayName(memberLookup[selectedDebt.creditor])}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="font-bold text-primary text-xl">
                  ৳{selectedDebt.originalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Date:</span>
                <span className="text-sm">
                  {format(new Date(selectedDebt.date), 'MMMM dd, yyyy')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Reason:</h4>
              <p className="text-sm">{selectedDebt.reason}</p>
            </div>

            {selectedDebt.notes && (
              <div className="space-y-2">
                <h4 className="font-medium">Notes:</h4>
                <p className="text-sm text-muted-foreground">{selectedDebt.notes}</p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium text-xs text-muted-foreground">Created By:</h4>
              <p className="text-sm">
                {getDisplayName(memberLookup[selectedDebt.createdBy])}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(selectedDebt.createdAt), 'MMM dd, yyyy hh:mm a')}
              </p>
            </div>

            {role === 'manager' && (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedDebt)}
                  disabled={loading}
                  icon={<XCircle size={18} />}
                  className="flex-1"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedDebt)}
                  disabled={loading}
                  icon={<CheckCircle size={18} />}
                  className="flex-1"
                >
                  {loading ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default PendingDebtApprovals;

