// Form component for adding new debt records
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import DatePicker from '../ui/DatePicker';
import { DollarSign, FileText } from 'lucide-react';
import { getDisplayName } from '../../utils/displayName';
import toast from 'react-hot-toast';

const DebtForm = ({ onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const { household, members } = useHousehold();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    debtor: currentUser?.uid || '', // Person who owes money
    creditor: '', // Person to whom money is owed
    amount: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      const debtsRef = collection(db, 'households', household.id, 'debts');
      
      await addDoc(debtsRef, {
        debtor: formData.debtor,
        creditor: formData.creditor,
        originalAmount: parseFloat(formData.amount),
        remainingAmount: parseFloat(formData.amount),
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
    } catch (error) {
      console.error('Error adding debt:', error);
      toast.error('Failed to add debt record');
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
          {loading ? 'Submitting...' : 'Submit Debt Record'}
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

