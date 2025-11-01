// Component to display list of expenses grouped by date with bulk actions
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  User,
  Users,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import { getDisplayName } from '../../utils/displayName';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const ExpenseList = ({ expenses, onExpenseClick }) => {
  const { currentUser } = useAuth();
  const { members, household, getUserRole } = useHousehold();
  const role = getUserRole();
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [expandedDates, setExpandedDates] = useState(new Set());
  const [selectedExpenses, setSelectedExpenses] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('ExpenseList Debug:', {
      role,
      isManager: role === 'manager',
      membersCount: members.length,
      currentUserId: currentUser?.uid,
      householdId: household?.id
    });
  }, [role, members.length, currentUser, household]);

  // Create member lookup
  const memberLookup = useMemo(() => {
    const lookup = {};
    members.forEach(member => {
      lookup[member.uid] = member;
    });
    return lookup;
  }, [members]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(exp => exp.status === statusFilter);
    }

    return filtered;
  }, [expenses, statusFilter]);

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const groups = {};
    
    filteredExpenses.forEach(expense => {
      const date = expense.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(expense);
    });

    // Sort dates
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));
    
    return sortedDates.map(date => ({
      date,
      expenses: groups[date],
      totalAmount: groups[date].reduce((sum, exp) => {
        // Support both old and new format
        const amount = exp.totalAmount || exp.amount || 0;
        return sum + parseFloat(amount);
      }, 0)
    }));
  }, [filteredExpenses]);

  const toggleDate = (date) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const toggleSelectExpense = (expenseId) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenses(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedExpenses.size === filteredExpenses.filter(e => e.status === 'pending').length) {
      setSelectedExpenses(new Set());
    } else {
      const allPending = new Set(filteredExpenses.filter(e => e.status === 'pending').map(e => e.id));
      setSelectedExpenses(allPending);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedExpenses.size === 0) {
      toast.error('No expenses selected');
      return;
    }

    setBulkActionLoading(true);
    try {
      const updates = Array.from(selectedExpenses).map(expenseId => {
        const expenseRef = doc(db, 'households', household.id, 'expenses', expenseId);
        return updateDoc(expenseRef, {
          status: action,
          approvedBy: currentUser.uid,
          approvedAt: new Date().toISOString()
        });
      });

      await Promise.all(updates);
      
      toast.success(`${selectedExpenses.size} expense${selectedExpenses.size > 1 ? 's' : ''} ${action}!`);
      setSelectedExpenses(new Set());
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success"><CheckCircle size={12} /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger"><XCircle size={12} /> Rejected</Badge>;
      case 'pending':
        return <Badge variant="warning"><Clock size={12} /> Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Helper to get items from expense (supports old and new format)
  const getExpenseItems = (expense) => {
    if (expense.items && Array.isArray(expense.items)) {
      // New format with multiple items
      return expense.items;
    } else {
      // Old format with single item
      return [{
        name: expense.item,
        amount: expense.amount,
        buyer: expense.buyer
      }];
    }
  };

  if (expenses.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
        <p className="text-lg text-muted-foreground">No expenses yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Add your first expense to get started
        </p>
      </Card>
    );
  }

  const pendingCount = filteredExpenses.filter(e => e.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Filters and Bulk Actions */}
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' }
                ]}
              />
            </div>
          </div>

          {/* Bulk Actions (Manager Only) */}
          {role === 'manager' && pendingCount > 0 && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-accent rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedExpenses.size > 0 && selectedExpenses.size === pendingCount}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-primary rounded border-gray-300"
                />
                <span className="text-sm font-medium">
                  Select All ({selectedExpenses.size} selected)
                </span>
              </label>
              {selectedExpenses.size > 0 && (
                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleBulkAction('approved')}
                    disabled={bulkActionLoading}
                  >
                    Approve Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleBulkAction('rejected')}
                    disabled={bulkActionLoading}
                  >
                    Reject Selected
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Grouped Expense List */}
      <div className="space-y-3">
        {groupedExpenses.map((group) => (
          <Card key={group.date}>
            {/* Date Header */}
            <div
              className="p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => toggleDate(group.date)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="text-primary" size={20} />
                  <div>
                    <h3 className="font-semibold text-lg">
                      {format(new Date(group.date), 'EEEE, MMMM dd, yyyy')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {group.expenses.length} expense{group.expenses.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">৳{group.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  {expandedDates.has(group.date) ? (
                    <ChevronUp size={24} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={24} className="text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Expenses */}
            <AnimatePresence>
              {expandedDates.has(group.date) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="p-4 space-y-3">
                    {group.expenses.map((expense) => {
                      const items = getExpenseItems(expense);
                      const sharedMembers = expense.sharedAmong?.map(uid => memberLookup[uid]) || [];
                      const canSelect = role === 'manager' && expense.status === 'pending';

                      return (
                        <motion.div
                          key={expense.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-accent/50 rounded-lg space-y-3 cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => onExpenseClick?.(expense)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Selection Checkbox */}
                            {canSelect && (
                              <input
                                type="checkbox"
                                checked={selectedExpenses.has(expense.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelectExpense(expense.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 mt-1 text-primary rounded border-gray-300"
                              />
                            )}

                            {/* Expense Details */}
                            <div className="flex-1 space-y-3">
                              {/* Items List */}
                              <div className="space-y-2">
                                {items.map((item, idx) => {
                                  const buyer = memberLookup[item.buyer];
                                  return (
                                    <div key={idx} className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <User size={12} />
                                          {getDisplayName(buyer)}
                                        </span>
                                      </div>
                                      <span className="font-bold text-primary">
                                        ৳{parseFloat(item.amount).toFixed(2)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Total (for multiple items) */}
                              {items.length > 1 && (
                                <div className="flex items-center justify-between pt-2 border-t border-border">
                                  <span className="font-semibold">Total</span>
                                  <span className="text-lg font-bold text-primary">
                                    ৳{(expense.totalAmount || expense.amount).toFixed(2)}
                                  </span>
                                </div>
                              )}

                              {/* Notes */}
                              {expense.notes && (
                                <p className="text-sm text-muted-foreground flex items-start gap-1">
                                  <FileText size={14} className="mt-0.5 flex-shrink-0" />
                                  {expense.notes}
                                </p>
                              )}

                              {/* Shared Among */}
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users size={14} />
                                <span>
                                  Shared by {sharedMembers.length} member(s)
                                  {sharedMembers.length <= 3 && ': ' + sharedMembers.map(m => getDisplayName(m)).join(', ')}
                                </span>
                              </div>

                              {/* Status Badge */}
                              <div>{getStatusBadge(expense.status)}</div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>

      {groupedExpenses.length === 0 && (
        <Card className="p-8 text-center">
          <Filter className="mx-auto mb-3 text-muted-foreground" size={36} />
          <p className="text-muted-foreground">No expenses match your filters</p>
        </Card>
      )}
    </div>
  );
};

export default ExpenseList;
