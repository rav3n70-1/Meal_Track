// Debt Settlement Component
import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import { getDisplayName } from '../../utils/displayName';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const DebtSettlement = ({ debt, onSuccess }) => {
  const { household, members } = useHousehold();
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(debt.remainingAmount.toString());
  const [paymentNote, setPaymentNote] = useState('');
  const [loading, setLoading] = useState(false);

  const debtor = members.find(m => m.uid === debt.debtor);
  const creditor = members.find(m => m.uid === debt.creditor);
  const canSettle = currentUser.uid === debt.debtor || currentUser.uid === debt.creditor;

  const handleSettleDebt = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > debt.remainingAmount) {
      toast.error('Invalid payment amount');
      return;
    }

    setLoading(true);
    try {
      const newRemaining = debt.remainingAmount - amount;
      const isFullyPaid = newRemaining <= 0.01;

      // Update debt status
      const debtRef = doc(db, 'households', household.id, 'debts', debt.id);
      await updateDoc(debtRef, {
        remainingAmount: Math.max(0, newRemaining),
        status: isFullyPaid ? 'paid' : 'approved',
        lastPaymentDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Add payment record
      const paymentsRef = collection(db, 'households', household.id, 'debtPayments');
      await addDoc(paymentsRef, {
        debtId: debt.id,
        debtorId: debt.debtor,
        creditorId: debt.creditor,
        amount: amount,
        note: paymentNote.trim(),
        paidBy: currentUser.uid,
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      toast.success(isFullyPaid ? 'Debt settled completely!' : `Payment of ৳${amount} recorded!`);
      setShowModal(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error settling debt:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPay = (amount) => {
    setPaymentAmount(amount.toString());
    setShowModal(true);
  };

  return (
    <>
      <Card className="relative overflow-hidden">
        <div className="p-4 space-y-3">
          {/* Debt Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-primary" />
                <h3 className="font-semibold">
                  {getDisplayName(debtor)} → {getDisplayName(creditor)}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Original: ৳{debt.amount.toFixed(2)}
              </p>
            </div>
            {debt.status === 'paid' && (
              <div className="bg-green-500 text-white p-2 rounded-full">
                <CheckCircle size={20} />
              </div>
            )}
          </div>

          {/* Amount Display */}
          <div className="text-center py-3 bg-accent rounded-lg">
            <p className="text-xs text-muted-foreground">Remaining Amount</p>
            <p className="text-2xl font-bold text-primary">৳{debt.remainingAmount.toFixed(2)}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((debt.amount - debt.remainingAmount) / debt.amount) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-green-500"
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {(((debt.amount - debt.remainingAmount) / debt.amount) * 100).toFixed(0)}% paid
            </p>
          </div>

          {/* Payment Date */}
          {debt.lastPaymentDate && (
            <p className="text-xs text-center text-muted-foreground">
              Last payment: {new Date(debt.lastPaymentDate).toLocaleDateString()}
            </p>
          )}

          {/* Actions */}
          {canSettle && debt.status !== 'paid' && (
            <div className="space-y-2 pt-2">
              <Button
                onClick={() => handleQuickPay(debt.remainingAmount)}
                className="w-full"
                icon={<CheckCircle size={16} />}
              >
                Settle Full Amount
              </Button>
              
              <div className="flex gap-2">
                {[Math.min(100, debt.remainingAmount), Math.min(500, debt.remainingAmount)].map(amount => (
                  amount > 0 && amount < debt.remainingAmount && (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickPay(amount)}
                      className="flex-1"
                    >
                      Pay ৳{amount}
                    </Button>
                  )
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(true)}
                  className="flex-1"
                >
                  Custom
                </Button>
              </div>
            </div>
          )}

          {!canSettle && (
            <div className="text-center text-sm text-muted-foreground py-2">
              <Clock size={16} className="inline mr-2" />
              Waiting for payment
            </div>
          )}
        </div>
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Payment"
      >
        <form onSubmit={handleSettleDebt} className="space-y-4">
          <div className="p-3 bg-accent rounded-lg text-sm">
            <p className="text-muted-foreground">Paying from:</p>
            <p className="font-semibold">{getDisplayName(debtor)}</p>
            <p className="text-muted-foreground mt-2">Paying to:</p>
            <p className="font-semibold">{getDisplayName(creditor)}</p>
          </div>

          <Input
            label={`Payment Amount (৳) - Max: ${debt.remainingAmount.toFixed(2)}`}
            type="number"
            step="0.01"
            min="0.01"
            max={debt.remainingAmount}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0.00"
            required
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Note (Optional)</label>
            <textarea
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="e.g., Bank transfer, Cash, etc."
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default DebtSettlement;

