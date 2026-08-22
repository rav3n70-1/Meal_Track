import React from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Repeat, Calendar, Trash2, Edit2, Play, Pause } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import { useHousehold } from '../../context/HouseholdContext';

const RecurringRentBillsList = ({ recurringRentBills = [], onEdit }) => {
  const { household, getUserRole } = useHousehold();
  const role = getUserRole();
  const isManager = role === 'manager';

  const handleDelete = async (bill) => {
    if (!isManager) return;
    if (window.confirm(`Are you sure you want to delete the recurring bill "${bill.description}"?`)) {
      try {
        await deleteDoc(doc(db, 'households', household.id, 'recurringRentBills', bill.id));
        toast.success('Recurring bill deleted successfully');
      } catch (error) {
        toast.error('Failed to delete recurring bill');
      }
    }
  };

  const handleToggleStatus = async (bill) => {
    if (!isManager) return;
    try {
      const newStatus = bill.status === 'active' ? 'paused' : 'active';
      const billRef = doc(db, 'households', household.id, 'recurringRentBills', bill.id);
      await updateDoc(billRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Recurring bill ${newStatus === 'active' ? 'resumed' : 'paused'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (recurringRentBills.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <Repeat className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground">No Recurring Rent/Bills</h3>
        <p className="text-muted-foreground mt-2">
          Set up automated rent and utility bills.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnimatePresence>
        {recurringRentBills.map((bill, index) => {
          return (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-card rounded-lg border p-4 shadow-sm transition-colors ${bill.status === 'paused' ? 'border-dashed border-muted bg-accent/30' : 'border-border hover:border-primary/50'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${bill.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-lg ${bill.status === 'paused' ? 'text-muted-foreground line-through' : ''}`}>
                      {bill.description}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={bill.status === 'active' ? 'success' : 'secondary'}>
                        {bill.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="capitalize flex items-center gap-1">
                        <Repeat size={12} />
                        {bill.frequency}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-bold ${bill.status === 'paused' ? 'text-muted-foreground' : 'text-primary'}`}>
                    ৳{parseFloat(bill.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mt-4 text-sm bg-accent/50 p-3 rounded-md">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categories:</span>
                  <span className="font-medium text-right w-48 truncate" title={bill.categories?.join(', ')}>
                    {bill.categories?.length || 0} categories
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar size={14} /> Next Due:
                  </span>
                  <span className={`font-semibold ${bill.status === 'active' && new Date(bill.nextDueDate) <= new Date() ? 'text-orange-500' : ''}`}>
                    {format(new Date(bill.nextDueDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>

              {/* Actions - Only Managers */}
              {isManager && (
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(bill)}
                    className={bill.status === 'active' ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950' : 'text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950'}
                    icon={bill.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                    title={bill.status === 'active' ? 'Pause' : 'Resume'}
                  >
                    {bill.status === 'active' ? 'Pause' : 'Resume'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(bill)}
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    icon={<Edit2 size={16} />}
                    title="Edit"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(bill)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    icon={<Trash2 size={16} />}
                    title="Delete"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default RecurringRentBillsList;
