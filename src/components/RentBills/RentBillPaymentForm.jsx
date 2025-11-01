// Payment form for recording rent/bill payments
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useRentBills } from '../../context/RentBillsContext';
import toast from 'react-hot-toast';

const RentBillPaymentForm = ({ bill, onSuccess, onCancel }) => {
  const { recordPayment } = useRentBills();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    notes: ''
  });

  const remainingAmount = bill ? bill.amount - (bill.paidAmount || 0) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const paymentAmount = parseFloat(formData.amount);

    // Validation
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (paymentAmount > remainingAmount) {
      toast.error(`Payment amount cannot exceed remaining amount (৳${remainingAmount.toFixed(2)})`);
      return;
    }

    setLoading(true);

    try {
      await recordPayment(bill.id, paymentAmount, formData.notes);
      toast.success('Payment recorded successfully');
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (!bill) return null;

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Bill Info */}
      <div className="bg-accent/50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Member:</span>
          <span className="font-semibold">{bill.memberName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Bill Type:</span>
          <span className="font-semibold capitalize">{bill.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Total Amount:</span>
          <span className="font-semibold">৳{bill.amount.toFixed(2)}</span>
        </div>
        {bill.paidAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Already Paid:</span>
            <span className="font-semibold text-green-600">৳{bill.paidAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Remaining:</span>
          <span className="font-bold text-lg text-red-600">৳{remainingAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Amount */}
      <Input
        label="Payment Amount (৳)"
        type="number"
        step="0.01"
        min="0.01"
        max={remainingAmount}
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        placeholder="0.00"
        required
      />

      {/* Quick Amount Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFormData({ ...formData, amount: (remainingAmount / 2).toFixed(2) })}
          className="flex-1"
        >
          Half (৳{(remainingAmount / 2).toFixed(2)})
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFormData({ ...formData, amount: remainingAmount.toFixed(2) })}
          className="flex-1"
        >
          Full (৳{remainingAmount.toFixed(2)})
        </Button>
      </div>

      {/* Payment Notes */}
      <div>
        <label className="block text-sm font-medium mb-2">Payment Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add any notes about this payment..."
          rows="3"
          className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Recording...' : 'Record Payment'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </motion.form>
  );
};

export default RentBillPaymentForm;

