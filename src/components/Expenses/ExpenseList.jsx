// Component to display list of expenses
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  DollarSign,
  User,
  Users,
  FileText,
  Filter
} from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Badge from '../ui/Badge';
import Select from '../ui/Select';
import { useHousehold } from '../../context/HouseholdContext';

const ExpenseList = ({ expenses, onExpenseClick }) => {
  const { members } = useHousehold();
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Create member lookup
  const memberLookup = useMemo(() => {
    const lookup = {};
    members.forEach(member => {
      lookup[member.uid] = member;
    });
    return lookup;
  }, [members]);

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(exp => exp.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date);
        case 'amount':
          return parseFloat(b.amount) - parseFloat(a.amount);
        case 'item':
          return a.item.localeCompare(b.item);
        default:
          return 0;
      }
    });

    return filtered;
  }, [expenses, statusFilter, sortBy]);

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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
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
          <div className="flex-1">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'date', label: 'Sort by Date' },
                { value: 'amount', label: 'Sort by Amount' },
                { value: 'item', label: 'Sort by Item' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Expense List */}
      <div className="space-y-3">
        {filteredExpenses.map((expense, index) => {
          const buyer = memberLookup[expense.buyer];
          const sharedMembers = expense.sharedAmong?.map(uid => memberLookup[uid]) || [];

          return (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                hover 
                onClick={() => onExpenseClick?.(expense)}
                className="p-4 cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left Side - Expense Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">{expense.item}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {format(new Date(expense.date), 'MMM dd, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {buyer?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="sm:hidden">{getStatusBadge(expense.status)}</div>
                    </div>

                    {expense.notes && (
                      <p className="text-sm text-muted-foreground flex items-start gap-1">
                        <FileText size={14} className="mt-0.5 flex-shrink-0" />
                        {expense.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users size={14} />
                      <span>
                        Shared by {sharedMembers.length} member(s)
                        {sharedMembers.length <= 3 && ': ' + sharedMembers.map(m => m?.name).join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Right Side - Amount and Status */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
                    <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                      <DollarSign size={20} />
                      {parseFloat(expense.amount).toFixed(2)}
                    </div>
                    <div className="hidden sm:block">{getStatusBadge(expense.status)}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredExpenses.length === 0 && (
        <Card className="p-8 text-center">
          <Filter className="mx-auto mb-3 text-muted-foreground" size={36} />
          <p className="text-muted-foreground">No expenses match your filters</p>
        </Card>
      )}
    </div>
  );
};

export default ExpenseList;

