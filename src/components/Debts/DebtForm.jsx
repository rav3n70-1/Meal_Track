// Form component for adding new debt records
import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import DatePicker from '../ui/DatePicker';
import { DollarSign, FileText } from 'lucide-react';
import { getDisplayName } from '../../utils/displayName';
import { roundDebtToNearestTen } from '../../utils/calculations';
import toast from 'react-hot-toast';

const DebtForm = ({ debt, onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const { household, members } = useHousehold();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!debt;

  const [formData, setFormData] = useState({
    debtor: currentUser?.uid || '', // Person who owes money
    creditor: '', // Person to whom money is owed
    amount: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [debtRounding, setDebtRounding] = useState(null); // Store rounding calculation

  // Pre-populate form if editing
  useEffect(() => {
    if (debt) {
      const amount = debt.originalAmount?.toString() || '';
      setFormData({
        debtor: debt.debtor || currentUser?.uid || '',
        creditor: debt.creditor || '',
        amount: amount,
        reason: debt.reason || '',
        date: debt.date || new Date().toISOString().split('T')[0],
        notes: debt.notes || ''
      });
      
      // Initialize rounding calculation if amount exists
      if (amount) {
        const amountNum = parseFloat(amount);
        if (!isNaN(amountNum) && amountNum > 0) {
          const rounding = roundDebtToNearestTen(amountNum);
          setDebtRounding(rounding);
        }
      }
    } else {
      setDebtRounding(null);
    }
  }, [debt, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Calculate rounding when amount changes
    if (name === 'amount' && value) {
      const amount = parseFloat(value);
      if (!isNaN(amount) && amount > 0) {
        const rounding = roundDebtToNearestTen(amount);
        setDebtRounding(rounding);
      } else {
        setDebtRounding(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.creditor) {
      toast.error('Please select who you owe money to');
      return;
    }

    if (formData.debtor === formData.creditor) {
      toast.error('You cannot owe money to yourself');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Please enter a reason for this debt');
      return;
    }

    setLoading(true);

    try {
      // Round debt amount to nearest 10
      const inputAmount = parseFloat(formData.amount);
      const rounding = roundDebtToNearestTen(inputAmount);
      const roundedAmount = rounding.rounded;
      
      if (isEditMode) {
        // Update existing debt
        const debtRef = doc(db, 'households', household.id, 'debts', debt.id);
        
        // Calculate new remaining amount if original amount changed
        let newRemainingAmount = debt.remainingAmount;
        const oldOriginalAmount = debt.originalAmount || debt.remainingAmount;
        if (roundedAmount !== oldOriginalAmount) {
          const amountDifference = roundedAmount - oldOriginalAmount;
          newRemainingAmount = Math.max(0, debt.remainingAmount + amountDifference);
        }

        await updateDoc(debtRef, {
          debtor: formData.debtor,
          creditor: formData.creditor,
          originalAmount: roundedAmount,
          remainingAmount: newRemainingAmount,
          reason: formData.reason.trim(),
          date: formData.date,
          notes: formData.notes.trim(),
          updatedAt: new Date().toISOString()
        });

        toast.success('Debt updated successfully!');
        if (onSuccess) onSuccess({ ...formData, originalAmount: roundedAmount, remainingAmount: newRemainingAmount });
      } else {
        // Create new debt
        const debtsRef = collection(db, 'households', household.id, 'debts');
        
        await addDoc(debtsRef, {
          debtor: formData.debtor,
          creditor: formData.creditor,
          originalAmount: roundedAmount,
          remainingAmount: roundedAmount,
          reason: formData.reason.trim(),
          date: formData.date,
          notes: formData.notes.trim(),
          status: 'pending', // pending, approved, rejected, paid
          type: 'manual', // manual debts require approval, auto debts are from expenses
          payments: [], // Array of payment records
          createdAt: new Date().toISOString(),
          createdBy: currentUser.uid,
          approvedBy: null,
          approvedAt: null,
          paidAt: null
        });

        toast.success('Debt record submitted for manager approval!');
        
        // Reset form
        setFormData({
          debtor: currentUser?.uid || '',
          creditor: '',
          amount: '',
          reason: '',
          date: new Date().toISOString().split('T')[0],
          notes: ''
        });

        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update debt record' : 'Failed to add debt record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <Select
        label="Who Owes Money (Debtor)"
        name="debtor"
        value={formData.debtor}
        onChange={handleChange}
        options={members.map(member => ({
          value: member.uid,
          label: getDisplayName(member)
        }))}
        required
      />

      <Select
        label="Owed To (Creditor)"
        name="creditor"
        value={formData.creditor}
        onChange={handleChange}
        options={members
          .filter(member => member.uid !== formData.debtor)
          .map(member => ({
            value: member.uid,
            label: getDisplayName(member)
          }))}
        required
      />

      <div className="space-y-2">
        <Input
          label="Amount (৳)"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          icon={<span className="text-primary font-bold">৳</span>}
          required
        />
        {debtRounding && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm font-medium text-primary">Calculation:</p>
            <p className="text-xs text-muted-foreground mt-1">{debtRounding.calculation}</p>
            <p className="text-sm font-semibold text-primary mt-2">
              Debt amount: ৳{debtRounding.rounded.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <Input
        label="Reason"
        name="reason"
        value={formData.reason}
        onChange={handleChange}
        placeholder="e.g., Borrowed for groceries, Personal loan, etc."
        icon={<FileText size={18} />}
        required
      />

      <DatePicker
        label="Date"
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
          placeholder="Add any additional notes..."
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update Debt' : 'Submit Debt Record')}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default DebtForm;

