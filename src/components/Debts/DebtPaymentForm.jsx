// Form component for recording payments towards a debt
import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import DatePicker from '../ui/DatePicker';
import { DollarSign } from 'lucide-react';
import { getDisplayName } from '../../utils/displayName';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const DebtPaymentForm = ({ debt, onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const { household, members } = useHousehold();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Get member lookup
  const memberLookup = {};
  members.forEach(member => {
    memberLookup[member.uid] = member;
  });

  const creditor = memberLookup[debt.creditor];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const triggerCelebration = () => {
    // Confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const paymentAmount = parseFloat(formData.amount);

    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (paymentAmount > debt.remainingAmount) {
      toast.error(`Payment amount cannot exceed remaining debt of ৳${debt.remainingAmount.toFixed(2)}`);
      return;
    }

    setLoading(true);

    try {
      const debtRef = doc(db, 'households', household.id, 'debts', debt.id);
      
      const newRemainingAmount = debt.remainingAmount - paymentAmount;
      const payment = {
        amount: paymentAmount,
        date: formData.date,
        notes: formData.notes.trim(),
        paidBy: currentUser.uid,
        paidAt: new Date().toISOString()
      };

      const updateData = {
        remainingAmount: newRemainingAmount,
        payments: arrayUnion(payment)
      };

      // If fully paid, update status and paidAt
      if (newRemainingAmount === 0) {
        updateData.status = 'paid';
        updateData.paidAt = new Date().toISOString();
      }

      await updateDoc(debtRef, updateData);

      // Show celebration if debt is fully paid
      if (newRemainingAmount === 0) {
        triggerCelebration();
        toast.success(
          '🎉 Congratulations! You have fully paid off this debt! 🎉',
          { duration: 5000 }
        );
      } else {
        toast.success(`Payment of ৳${paymentAmount.toFixed(2)} recorded successfully!`);
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Debt Summary */}
      <div className="bg-accent rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Paying to:</span>
          <span className="font-medium">{getDisplayName(creditor)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Remaining Balance:</span>
          <span className="font-bold text-lg text-red-600 dark:text-red-400">
            ৳{debt.remainingAmount.toFixed(2)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Original: ৳{debt.originalAmount.toFixed(2)} • Reason: {debt.reason}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Payment Amount (৳)"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          max={debt.remainingAmount}
          value={formData.amount}
          onChange={handleChange}
          placeholder={`Max: ${debt.remainingAmount.toFixed(2)}`}
          icon={<span className="text-primary font-bold">৳</span>}
          required
        />

        <DatePicker
          label="Payment Date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any notes about this payment..."
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default DebtPaymentForm;

