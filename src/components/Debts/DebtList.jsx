// Component to display list of debts with filtering and actions
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Calendar,
  Zap,
  User
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import DebtPaymentForm from './DebtPaymentForm';
import DebtSettlement from './DebtSettlement';
import { getDisplayName } from '../../utils/displayName';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';

const DebtList = ({ debts }) => {
  const { currentUser } = useAuth();
  const { members, getUserRole } = useHousehold();
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, my-debts, owed-to-me
  const role = getUserRole();

  // Create member lookup
  const memberLookup = {};
  members.forEach(member => {
    memberLookup[member.uid] = member;
  });

  // Filter debts based on user role
  const filteredDebts = debts.filter(debt => {
    // Skip non-approved debts
    if (debt.status !== 'approved') return false;

    // Apply specific filters
    if (filter === 'my-debts') {
      return debt.debtor === currentUser?.uid;
    }
    if (filter === 'owed-to-me') {
      return debt.creditor === currentUser?.uid;
    }
    
    // 'all' filter - depends on role
    if (role === 'manager') {
      // Managers see ALL debts
      return true;
    } else {
      // Regular members only see debts involving them
      return debt.debtor === currentUser?.uid || debt.creditor === currentUser?.uid;
    }
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success"><CheckCircle size={12} /> Active</Badge>;
      case 'rejected':
        return <Badge variant="danger"><XCircle size={12} /> Rejected</Badge>;
      case 'pending':
        return <Badge variant="warning"><Clock size={12} /> Pending</Badge>;
      case 'paid':
        return <Badge variant="success"><CheckCircle size={12} /> Paid</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handlePaymentClick = (debt) => {
    setSelectedDebt(debt);
    setShowPaymentModal(true);
  };

  if (filteredDebts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debt Records</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
          <p className="text-muted-foreground">
            {filter === 'my-debts' 
              ? "You don't have any active debts! 🎉"
              : filter === 'owed-to-me'
              ? "No one owes you money! 🎉"
              : "No debt records found"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Debt Records ({filteredDebts.length})</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                {role === 'manager' ? 'All Debts' : 'My Debts'}
              </Button>
              <Button
                size="sm"
                variant={filter === 'my-debts' ? 'default' : 'outline'}
                onClick={() => setFilter('my-debts')}
              >
                I Owe
              </Button>
              <Button
                size="sm"
                variant={filter === 'owed-to-me' ? 'default' : 'outline'}
                onClick={() => setFilter('owed-to-me')}
              >
                Owed to Me
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredDebts.map((debt, index) => {
            const debtor = memberLookup[debt.debtor];
            const creditor = memberLookup[debt.creditor];
            const percentPaid = ((debt.originalAmount - debt.remainingAmount) / debt.originalAmount) * 100;
            const isMyDebt = debt.debtor === currentUser?.uid;

            return (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-border rounded-lg p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium ${isMyDebt ? 'text-red-600 dark:text-red-400' : ''}`}>
                        {getDisplayName(debtor)}
                      </span>
                      <ArrowRight className="text-muted-foreground" size={18} />
                      <span className={`font-medium ${!isMyDebt ? 'text-green-600 dark:text-green-400' : ''}`}>
                        {getDisplayName(creditor)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Type Badge */}
                    {debt.type === 'auto' ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Zap size={12} />
                        Auto
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <User size={12} />
                        Manual
                      </Badge>
                    )}
                    {getStatusBadge(debt.status)}
                  </div>
                </div>

                {/* Reason and Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{debt.reason}</p>
                    {debt.type === 'auto' && (
                      <span className="text-xs text-muted-foreground italic">
                        (from shared expenses)
                      </span>
                    )}
                  </div>
                  {debt.notes && debt.type === 'manual' && (
                    <p className="text-xs text-muted-foreground">{debt.notes}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(debt.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>

                {/* Amount Info */}
                <div className="bg-accent rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Original Amount:</span>
                    <span className="font-bold text-primary">৳{debt.originalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Remaining:</span>
                    <span className="font-bold text-lg">
                      {debt.remainingAmount > 0 ? (
                        <span className="text-red-600 dark:text-red-400">
                          ৳{debt.remainingAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">
                          ৳0.00
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{percentPaid.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentPaid}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          percentPaid === 100 
                            ? 'bg-green-600' 
                            : 'bg-gradient-to-r from-yellow-500 to-primary'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Payments History */}
                {debt.payments && debt.payments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Payment History ({debt.payments.length}):
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {debt.payments.map((payment, idx) => (
                        <div 
                          key={idx}
                          className="text-xs bg-muted/50 rounded px-2 py-1 flex justify-between items-center"
                        >
                          <span>
                            {format(new Date(payment.date), 'MMM dd, yyyy')}
                          </span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            +৳{payment.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {isMyDebt && debt.remainingAmount > 0 && debt.status === 'approved' && (
                  <Button 
                    size="sm" 
                    onClick={() => handlePaymentClick(debt)}
                    icon={<DollarSign size={16} />}
                    className="w-full"
                  >
                    {debt.type === 'auto' ? 'Record Payment' : 'Record Payment (Manual Debt)'}
                  </Button>
                )}
                
                {/* Info for auto debts */}
                {debt.type === 'auto' && debt.status === 'approved' && (
                  <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Zap size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <p>
                        This debt was automatically calculated from shared expenses where{' '}
                        <span className="font-medium">{getDisplayName(debtor)}</span> consumed{' '}
                        their share but{' '}
                        <span className="font-medium">{getDisplayName(creditor)}</span> paid.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedDebt(null);
        }}
        title="Record Debt Payment"
        size="md"
      >
        {selectedDebt && (
          <DebtPaymentForm
            debt={selectedDebt}
            onSuccess={() => {
              setShowPaymentModal(false);
              setSelectedDebt(null);
            }}
            onCancel={() => {
              setShowPaymentModal(false);
              setSelectedDebt(null);
            }}
          />
        )}
      </Modal>
    </>
  );
};

export default DebtList;

