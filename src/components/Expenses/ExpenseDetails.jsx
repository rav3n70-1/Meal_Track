// Component to show detailed expense information and approval actions
import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  Users,
  FileText,
  Clock
} from 'lucide-react';
import { getDisplayName } from '../../utils/displayName';
import { getCategoryLabel } from '../../utils/categories';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ExpenseComments from '../Comments/ExpenseComments';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import toast from 'react-hot-toast';

const ExpenseDetails = ({ expense, isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { household, members, getUserRole } = useHousehold();
  const [loading, setLoading] = useState(false);
  const role = getUserRole();

  if (!expense) return null;

  // Create member lookup
  const memberLookup = {};
  members.forEach(member => {
    memberLookup[member.uid] = member;
  });

  // Support both old and new format
  const items = expense.items || [{ name: expense.item, amount: expense.amount, buyer: expense.buyer }];
  const totalAmount = expense.totalAmount || expense.amount;
  const sharedMembers = expense.sharedAmong?.map(uid => memberLookup[uid]) || [];
  const sharePerPerson = sharedMembers.length > 0 
    ? parseFloat(totalAmount) / sharedMembers.length 
    : 0;

  const handleApprove = async () => {
    if (role !== 'manager') {
      toast.error('Only managers can approve expenses');
      return;
    }

    setLoading(true);
    try {
      const expenseRef = doc(db, 'households', household.id, 'expenses', expense.id);
      await updateDoc(expenseRef, {
        status: 'approved',
        approvedBy: currentUser.uid,
        approvedAt: new Date().toISOString()
      });

      toast.success('Expense approved!');
      onClose();
    } catch (error) {
      console.error('Error approving expense:', error);
      toast.error('Failed to approve expense');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (role !== 'manager') {
      toast.error('Only managers can reject expenses');
      return;
    }

    setLoading(true);
    try {
      const expenseRef = doc(db, 'households', household.id, 'expenses', expense.id);
      await updateDoc(expenseRef, {
        status: 'rejected',
        approvedBy: currentUser.uid,
        approvedAt: new Date().toISOString()
      });

      toast.success('Expense rejected');
      onClose();
    } catch (error) {
      console.error('Error rejecting expense:', error);
      toast.error('Failed to reject expense');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success"><CheckCircle size={12} /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger"><XCircle size={12} /> Rejected</Badge>;
      case 'pending':
        return <Badge variant="warning"><Clock size={12} /> Pending Approval</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const footer = (
    <>
      {expense.status === 'pending' && role === 'manager' && (
        <>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
            icon={<XCircle size={18} />}
          >
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading}
            icon={<CheckCircle size={18} />}
          >
            {loading ? 'Processing...' : 'Approve'}
          </Button>
        </>
      )}
      {expense.status !== 'pending' && (
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Expense Details"
      footer={footer}
      size="lg"
    >
      <div className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          {getStatusBadge(expense.status)}
        </div>

        {/* Items List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">Items ({items.length})</h4>
          {items.map((item, idx) => {
            const buyer = memberLookup[item.buyer];
            return (
              <div key={idx} className="p-3 bg-accent rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                    <span className="text-xl">৳</span>
                    {parseFloat(item.amount).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User size={14} />
                  <span>Paid by {getDisplayName(buyer)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Amount (if multiple items) */}
        {items.length > 1 && (
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">Total Amount</span>
              <div className="flex items-center gap-1 text-3xl font-bold text-primary">
                <span className="text-2xl">৳</span>
                {parseFloat(totalAmount).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Date */}
        <div className="flex items-start gap-3 p-3 bg-accent rounded-lg">
          <Calendar className="text-primary mt-1" size={20} />
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">
              {format(new Date(expense.date), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>

        {/* Shared Among */}
        <div className="p-4 bg-accent rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Users className="text-primary" size={20} />
            <h4 className="font-semibold">Shared Among ({sharedMembers.length})</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sharedMembers.map((member) => (
              <div 
                key={member?.uid} 
                className="flex items-center justify-between p-2 bg-background rounded"
              >
                <div className="flex items-center gap-2">
                  {member?.photoURL && (
                    <img 
                      src={member.photoURL} 
                      alt={getDisplayName(member)}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium">{getDisplayName(member)}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ৳{sharePerPerson.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category */}
        {expense.category && (
          <div className="p-4 bg-accent rounded-lg">
            <p className="text-sm text-muted-foreground">
              Category: <span className="font-semibold">{getCategoryLabel(expense.category)}</span>
            </p>
          </div>
        )}

        {/* Notes */}
        {expense.notes && (
          <div className="p-4 bg-accent rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <FileText className="text-primary mt-0.5" size={20} />
              <h4 className="font-semibold">Notes</h4>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {expense.notes}
            </p>
          </div>
        )}

        {/* Receipt Images */}
        {expense.receipts && expense.receipts.length > 0 && (
          <div className="p-4 bg-accent rounded-lg">
            <h4 className="font-semibold mb-3">Receipt Images</h4>
            <div className="flex flex-wrap gap-2">
              {expense.receipts.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Receipt ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-lg border border-border cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="p-4 bg-accent rounded-lg">
          <ExpenseComments expenseId={expense.id} />
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
          <p>Created: {format(new Date(expense.createdAt), 'MMM dd, yyyy HH:mm')}</p>
          {expense.approvedAt && (
            <p>
              {expense.status === 'approved' ? 'Approved' : 'Rejected'}: {format(new Date(expense.approvedAt), 'MMM dd, yyyy HH:mm')}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ExpenseDetails;

