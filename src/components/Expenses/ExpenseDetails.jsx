// Component to show detailed expense information and approval actions
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  Users,
  FileText,
  Clock,
  Edit2,
  Trash2
} from 'lucide-react';
import { getDisplayName } from '../../utils/displayName';
import { roundUpSharedAmount } from '../../utils/calculations';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { useActivity } from '../../context/ActivityContext';
import toast from 'react-hot-toast';

const ExpenseDetails = ({ expense, isOpen, onClose, onEdit }) => {
  const { currentUser } = useAuth();
  const { household, members, getUserRole, expenses, debts, recalculateDebts } = useHousehold();
  const { logActivity } = useActivity();
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
  
  // Calculate rounded up share per person
  const shareCalc = sharedMembers.length > 0 
    ? roundUpSharedAmount(parseFloat(totalAmount), sharedMembers.length)
    : { exact: 0, rounded: 0, calculation: '' };
  const sharePerPerson = shareCalc.rounded;

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
      
      await logActivity(
        'expense_approved',
        `${currentUser?.displayName || 'Manager'} approved an expense for ৳${totalAmount}`,
        { expenseId: expense.id, totalAmount }
      );
      
      onClose();
    } catch (error) {
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
      
      await logActivity(
        'expense_rejected',
        `${currentUser?.displayName || 'Manager'} rejected an expense for ৳${totalAmount}`,
        { expenseId: expense.id, totalAmount }
      );
      
      onClose();
    } catch (error) {
      toast.error('Failed to reject expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (role !== 'manager') {
      toast.error('Only managers can delete expenses');
      return;
    }

    if (!household?.id) {
      toast.error('Household not found');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this expense? This will automatically adjust related debts.')) {
      return;
    }

    setLoading(true);
    try {
      const expenseRef = doc(db, 'households', household.id, 'expenses', expense.id);
      
      // Check if expense was approved (only approved expenses generate debts)
      const wasApproved = expense.status === 'approved';
      
      // Calculate remaining expenses before deletion (excluding the one being deleted)
      const remainingExpenses = expenses.filter(exp => exp.id !== expense.id);
      
      // Delete the expense
      await deleteDoc(expenseRef);

      // If the expense was approved, immediately recalculate debts to remove/adjust related auto debts
      if (wasApproved && members.length > 0 && remainingExpenses.length >= 0) {
        try {
          // Import debt generation utility
          const { updateAutomaticDebts } = await import('../../utils/debtGeneration');
          
          // Recalculate debts with remaining expenses (this will remove debts related to deleted expense)
          await updateAutomaticDebts(household.id, remainingExpenses, members, debts);
          
          toast.success('Expense deleted and debts adjusted successfully');
        } catch (debtError) {
          console.error('Error adjusting debts:', debtError);
          // Expense is deleted, but debt adjustment failed - the useEffect will handle it
          toast.success('Expense deleted successfully. Debts will be adjusted automatically.');
        }
      } else {
        toast.success('Expense deleted successfully');
      }
      
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to delete expense');
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
      {role === 'manager' && (
        <>
          {onEdit && (
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(expense);
              }}
              disabled={loading}
              icon={<Edit2 size={18} />}
            >
              Edit
            </Button>
          )}
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={loading}
            icon={<Trash2 size={18} />}
          >
            Delete
          </Button>
        </>
      )}
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
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
          
          {/* Calculation Display */}
          {shareCalc.calculation && (
            <div className="mb-3 p-3 bg-primary/10 rounded-lg border border-primary/20 space-y-2">
              <p className="text-sm font-medium text-primary">Calculation Breakdown:</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Total:</span>
                  <span>৳{(parseFloat(totalAmount)).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Shared among:</span>
                  <span>{sharedMembers.length} {sharedMembers.length === 1 ? 'person' : 'people'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Exact share:</span>
                  <span>৳{shareCalc.exact.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <span className="font-medium">Rounded to nearest 10:</span>
                  <span>
                    ৳{shareCalc.exact.toFixed(2)}
                    {shareCalc.difference !== 0 && (
                      <>
                        {shareCalc.difference > 0 ? '+' : ''}৳{Math.abs(shareCalc.difference).toFixed(2)}
                      </>
                    )}
                    {' = '}৳{shareCalc.rounded.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-primary/20 text-xs italic text-muted-foreground">
                  This rounding up is necessary to make calculations and debt payment easier
                </div>
              </div>
            </div>
          )}
          
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
                <span className="text-sm font-semibold">
                  ৳{sharePerPerson.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

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

