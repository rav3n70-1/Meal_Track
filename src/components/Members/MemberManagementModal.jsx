// Modal component for managing member information (manager only)
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Crown, Save, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import toast from 'react-hot-toast';

const MemberManagementModal = ({ isOpen, onClose, member, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nickname: '',
    role: 'member'
  });
  const [saving, setSaving] = useState(false);

  // Populate form when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        email: member.email || '',
        nickname: member.nickname || '',
        role: member.role || 'member'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        nickname: '',
        role: 'member'
      });
    }
  }, [member]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        nickname: formData.nickname.trim()
      });
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save member');
    } finally {
      setSaving(false);
    }
  };

  const roleOptions = [
    { value: 'member', label: 'Member' },
    { value: 'manager', label: 'Manager' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={member ? `Edit Member - ${member.name}` : 'Add New Member'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
            icon={<User size={18} />}
            required
          />
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            icon={<Mail size={18} />}
            required
            disabled={!!member} // Email cannot be changed for existing members
          />
          {member && (
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed for existing members
            </p>
          )}
        </div>

        {/* Nickname Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Nickname <span className="text-muted-foreground text-xs">(Optional)</span>
          </label>
          <Input
            type="text"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            placeholder="Enter nickname (optional)"
          />
          <p className="text-xs text-muted-foreground mt-1">
            If set, nickname will be displayed instead of full name
          </p>
        </div>

        {/* Role Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Role <span className="text-red-500">*</span>
          </label>
          <Select
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={roleOptions}
            icon={<Crown size={18} />}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Managers have full control over the household
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            icon={<Save size={18} />}
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Saving...' : member ? 'Save Changes' : 'Add Member'}
          </Button>
          <Button
            type="button"
            variant="outline"
            icon={<X size={18} />}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MemberManagementModal;

