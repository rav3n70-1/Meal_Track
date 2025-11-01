// Manual Member Form - Add members without Gmail
import React, { useState } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const ManualMemberForm = ({ onSuccess, onCancel }) => {
  const { household } = useHousehold();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate a unique ID for manual member
      const manualMemberId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const memberRef = doc(db, 'households', household.id, 'members', manualMemberId);
      await setDoc(memberRef, {
        uid: manualMemberId,
        name: formData.name.trim(),
        nickname: formData.nickname.trim() || null,
        phone: formData.phone.trim() || null,
        email: null,
        photoURL: null,
        role: 'manual', // Special role for bill-only members
        type: 'manual', // Distinguish from Google auth members
        billsOnly: true, // Flag to indicate this member only pays bills
        joinedAt: new Date().toISOString(),
        createdBy: currentUser.uid
      });

      toast.success('Manual member added successfully!');
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error adding manual member:', error);
      toast.error('Failed to add manual member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
        <p className="font-medium mb-1">ℹ️ Bill-Only Member</p>
        <p>This member will only appear in recurring expenses (rent, bills, etc.) and will not be included in regular shared meal expenses.</p>
      </div>

      <Input
        label="Member Name"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="e.g., John Doe"
        required
      />

      <Input
        label="Nickname (Optional)"
        value={formData.nickname}
        onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
        placeholder="e.g., Johnny"
      />

      <Input
        label="Phone Number (Optional)"
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
        placeholder="e.g., +880 1234567890"
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Adding...' : 'Add Member'}
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

export default ManualMemberForm;

