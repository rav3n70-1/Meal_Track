import React from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Repeat, Calendar, Trash2, Edit2, Play, Pause } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { getDisplayName } from '../../utils/displayName';
import { useHousehold } from '../../context/HouseholdContext';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useActivity } from '../../context/ActivityContext';

const RecurringExpensesList = ({ recurringExpenses = [], onEdit }) => {
  const { household, members, getUserRole } = useHousehold();
  const { currentUser } = useAuth();
  const { logActivity } = useActivity();
  const role = getUserRole();

  const getMemberName = (uid) => {
    const member = members.find(m => m.uid === uid);
    return getDisplayName(member);
  };

  const handleDelete = async (expense) => {
    if (window.confirm(`Are you sure you want to delete the recurring expense "${expense.name}"?`)) {
      try {
        await deleteDoc(doc(db, 'households', household.id, 'recurringExpenses', expense.id));
        toast.success('Recurring expense deleted successfully');
        await logActivity(
          'recurring_deleted',
          `${currentUser?.displayName} deleted recurring expense: ${expense.name}`
        );
      } catch (error) {
        toast.error('Failed to delete recurring expense');
      }
    }
  };

  const handleToggleStatus = async (expense) => {
    try {
      const newStatus = expense.status === 'active' ? 'paused' : 'active';
      const expenseRef = doc(db, 'households', household.id, 'recurringExpenses', expense.id);
      await updateDoc(expenseRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Recurring expense ${newStatus === 'active' ? 'resumed' : 'paused'}`);
      await logActivity(
        newStatus === 'active' ? 'recurring_resumed' : 'recurring_paused',
        `${currentUser?.displayName} ${newStatus === 'active' ? 'resumed' : 'paused'} recurring expense: ${expense.name}`
      );
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (recurringExpenses.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <Repeat className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground">No Recurring Expenses</h3>
        <p className="text-muted-foreground mt-2">
          Set up automated expenses like rent, internet, or subscriptions.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnimatePresence>
        {recurringExpenses.map((expense, index) => {
          const isManager = role === 'manager';
          const isCreator = currentUser?.uid === expense.createdBy;
          const canEdit = isManager || isCreator;
          const canDelete = isManager;

          return (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-card rounded-lg border p-4 shadow-sm transition-colors ${expense.status === 'paused' ? 'border-dashed border-muted bg-accent/30' : 'border-border hover:border-primary/50'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${expense.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-lg ${expense.status === 'paused' ? 'text-muted-foreground line-through' : ''}`}>
                      {expense.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={expense.status === 'active' ? 'success' : 'secondary'}>
                        {expense.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="capitalize flex items-center gap-1">
                        <Repeat size={12} />
                        {expense.frequency}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-bold ${expense.status === 'paused' ? 'text-muted-foreground' : 'text-primary'}`}>
                    ৳{parseFloat(expense.amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mt-4 text-sm bg-accent/50 p-3 rounded-md">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid By:</span>
                  <span className="font-medium">{getMemberName(expense.buyer)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shared Among:</span>
                  <span className="font-medium text-right w-48 truncate" title={expense.sharedAmong.map(getMemberName).join(', ')}>
                    {expense.sharedAmong.length} {expense.sharedAmong.length === 1 ? 'member' : 'members'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar size={14} /> Next Due:
                  </span>
                  <span className={`font-semibold ${expense.status === 'active' && new Date(expense.nextDueDate) <= new Date() ? 'text-orange-500' : ''}`}>
                    {format(new Date(expense.nextDueDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {(canEdit || canDelete) && (
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(expense)}
                      className={expense.status === 'active' ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950' : 'text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950'}
                      icon={expense.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                      title={expense.status === 'active' ? 'Pause' : 'Resume'}
                    >
                      {expense.status === 'active' ? 'Pause' : 'Resume'}
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(expense)}
                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                      icon={<Edit2 size={16} />}
                      title="Edit"
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(expense)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      icon={<Trash2 size={16} />}
                      title="Delete"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default RecurringExpensesList;
