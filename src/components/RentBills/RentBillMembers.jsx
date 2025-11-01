// Component for managing rent-only members
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Edit2, Trash2, Mail, User } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { useRentBills } from '../../context/RentBillsContext';
import toast from 'react-hot-toast';

const RentBillMembers = () => {
  const { rentBillMembers, addRentBillMember, updateRentBillMember, removeRentBillMember, getMemberRentBills } = useRentBills();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    nickname: ''
  });

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!formData.name || formData.name.trim() === '') {
      toast.error('Please enter a name');
      return;
    }

    setLoading(true);

    try {
      // Create a unique ID based on email for tracking purposes
      // The member doesn't need to login - this is just for record keeping
      const memberId = 'rentmember_' + formData.email.replace(/[@.]/g, '_').toLowerCase();
      
      await addRentBillMember({
        uid: memberId,
        email: formData.email,
        name: formData.name,
        nickname: formData.nickname,
        isRentOnly: true
      });

      toast.success('Rent-only member added successfully');
      setShowAddModal(false);
      setFormData({ email: '', name: '', nickname: '' });
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMember = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await updateRentBillMember(selectedMember.uid, {
        name: formData.name,
        nickname: formData.nickname
      });

      toast.success('Member updated successfully');
      setShowEditModal(false);
      setSelectedMember(null);
      setFormData({ email: '', name: '', nickname: '' });
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error(error.message || 'Failed to update member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (member) => {
    const memberBills = getMemberRentBills(member.uid);
    
    if (memberBills.length > 0) {
      const confirmed = window.confirm(
        `This member has ${memberBills.length} bill(s). Removing them will not delete their bills. Continue?`
      );
      if (!confirmed) return;
    } else {
      if (!window.confirm(`Are you sure you want to remove ${member.name}?`)) return;
    }

    try {
      await removeRentBillMember(member.uid);
      toast.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      email: member.email,
      name: member.name,
      nickname: member.nickname || ''
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Rent-Only Members</h2>
        <Button
          onClick={() => setShowAddModal(true)}
          icon={<UserPlus size={18} />}
        >
          Add Member
        </Button>
      </div>

      {/* Members List */}
      {rentBillMembers.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <User size={48} className="mx-auto mb-4 opacity-50" />
            <p className="mb-2">No rent-only members yet</p>
            <p className="text-sm">Add members who only need to track and pay rent/bills</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {rentBillMembers.map((member, index) => {
              const memberBills = getMemberRentBills(member.uid);
              const unpaidBills = memberBills.filter(b => b.status === 'unpaid').length;
              
              return (
                <motion.div
                  key={member.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              {member.name}
                              {member.nickname && (
                                <span className="text-sm text-muted-foreground font-normal">
                                  ({member.nickname})
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail size={14} />
                              {member.email}
                            </p>
                          </div>
                          <Badge variant="primary">Rent Only</Badge>
                        </div>

                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Bills: </span>
                            <span className="font-semibold">{memberBills.length}</span>
                          </div>
                          {unpaidBills > 0 && (
                            <div>
                              <span className="text-muted-foreground">Unpaid: </span>
                              <span className="font-semibold text-red-600">{unpaidBills}</span>
                            </div>
                          )}
                        </div>

                        {member.createdAt && (
                          <p className="text-xs text-muted-foreground">
                            Added: {new Date(member.createdAt.seconds * 1000).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(member)}
                          icon={<Edit2 size={16} />}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemoveMember(member)}
                          icon={<Trash2 size={16} />}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData({ email: '', name: '', nickname: '' });
        }}
        title="Add Rent-Only Member"
        size="md"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
            <p className="text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> This creates a record for tracking rent/bills for members who are not part of the household expenses. 
              This is for record-keeping purposes only - they don't need to login to the system.
            </p>
          </div>

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="member@example.com"
            required
          />

          <Input
            label="Full Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
          />

          <Input
            label="Nickname (Optional)"
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            placeholder="Johnny"
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setFormData({ email: '', name: '', nickname: '' });
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMember(null);
          setFormData({ email: '', name: '', nickname: '' });
        }}
        title="Edit Member"
        size="md"
      >
        <form onSubmit={handleEditMember} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            disabled
            readOnly
          />

          <Input
            label="Full Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
          />

          <Input
            label="Nickname (Optional)"
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            placeholder="Johnny"
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Updating...' : 'Update Member'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedMember(null);
                setFormData({ email: '', name: '', nickname: '' });
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RentBillMembers;

