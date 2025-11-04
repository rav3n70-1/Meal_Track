// Activity log page showing recent actions with detailed breakdowns
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Navigate } from 'react-router-dom';
import { 
  Plus, 
  CheckCircle, 
  XCircle, 
  Calendar,
  FileText,
  Receipt,
  DollarSign,
  Users,
  Building2,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useHousehold } from '../context/HouseholdContext';
import { useRentBills } from '../context/RentBillsContext';
import { getDisplayName } from '../utils/displayName';
import { getExpenseTotalAmount } from '../utils/calculations';
import Loading from '../components/ui/Loading';

const Activity = () => {
  const { expenses, members, debts, loading, getUserRole } = useHousehold();
  const { rentBills } = useRentBills();
  const [expandedActivities, setExpandedActivities] = useState(new Set());

  const role = getUserRole();
  if (role !== 'manager') {
    return <Navigate to="/dashboard" replace />;
  }

  // Helper function to safely convert timestamps to Date objects
  const safeDate = (timestamp) => {
    if (!timestamp) return null;
    // Handle Firestore Timestamp objects
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    // Handle ISO strings
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }
    // Handle Date objects
    if (timestamp instanceof Date) {
      return isNaN(timestamp.getTime()) ? null : timestamp;
    }
    // Handle Unix timestamps (seconds or milliseconds)
    if (typeof timestamp === 'number') {
      const date = timestamp < 10000000000 ? new Date(timestamp * 1000) : new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  };

  // Helper function to safely format dates
  const safeFormat = (timestamp, formatStr) => {
    const date = safeDate(timestamp);
    if (!date) return 'N/A';
    try {
      return format(date, formatStr);
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Create member lookup
  const memberLookup = useMemo(() => {
    const lookup = {};
    members.forEach(member => {
      lookup[member.uid] = member;
    });
    return lookup;
  }, [members]);

  // Toggle expand/collapse
  const toggleExpand = (id) => {
    setExpandedActivities(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Generate activity log from expenses, debts, and rent/bills
  const activities = useMemo(() => {
    const acts = [];

    // Expense activities
    expenses.forEach(expense => {
      const creator = memberLookup[expense.createdBy];
      
      // Expense created
      acts.push({
        id: `expense-${expense.id}-created`,
        type: 'expense',
        action: 'created',
        entity: expense,
        user: creator,
        timestamp: expense.createdAt,
        icon: Receipt,
        color: 'text-blue-500'
      });

      // Expense approved/rejected
      if (expense.status !== 'pending' && expense.approvedAt) {
        const approver = memberLookup[expense.approvedBy];
        acts.push({
          id: `expense-${expense.id}-${expense.status}`,
          type: 'expense',
          action: expense.status,
          entity: expense,
          user: approver,
          timestamp: expense.approvedAt,
          icon: expense.status === 'approved' ? CheckCircle : XCircle,
          color: expense.status === 'approved' ? 'text-green-500' : 'text-red-500'
        });
      }
    });

    // Debt activities
    debts.forEach(debt => {
      const creator = memberLookup[debt.createdBy];
      
      // Debt created
      acts.push({
        id: `debt-${debt.id}-created`,
        type: 'debt',
        action: 'created',
        entity: debt,
        user: creator,
        timestamp: debt.createdAt,
        icon: DollarSign,
        color: 'text-purple-500'
      });

      // Debt approved/rejected
      if (debt.status !== 'pending' && debt.approvedAt) {
        const approver = memberLookup[debt.approvedBy];
        acts.push({
          id: `debt-${debt.id}-${debt.status}`,
          type: 'debt',
          action: debt.status,
          entity: debt,
          user: approver,
          timestamp: debt.approvedAt,
          icon: debt.status === 'approved' ? CheckCircle : XCircle,
          color: debt.status === 'approved' ? 'text-green-500' : 'text-red-500'
        });
      }

      // Debt payments
      if (Array.isArray(debt.payments)) {
        debt.payments.forEach((payment, idx) => {
          const paidByMember = memberLookup[payment.paidBy];
          acts.push({
            id: `debt-${debt.id}-payment-${idx}`,
            type: 'debt',
            action: 'payment',
            entity: debt,
            payment: payment,
            user: paidByMember,
            timestamp: payment.paidAt || payment.date,
            icon: DollarSign,
            color: 'text-green-500'
          });
        });
      }

      // Debt fully paid
      if (debt.status === 'paid' && debt.paidAt) {
        acts.push({
          id: `debt-${debt.id}-paid`,
          type: 'debt',
          action: 'paid',
          entity: debt,
          user: memberLookup[debt.debtor],
          timestamp: debt.paidAt,
          icon: CheckCircle,
          color: 'text-green-500'
        });
      }
    });

    // Rent/Bills activities
    rentBills.forEach(bill => {
      const creator = memberLookup[bill.createdBy];
      
      // Bill created
      acts.push({
        id: `bill-${bill.id}-created`,
        type: 'rent-bill',
        action: 'created',
        entity: bill,
        user: creator,
        timestamp: bill.createdAt,
        icon: Building2,
        color: 'text-orange-500'
      });

      // Bill payments (if payment history exists)
      if (bill.paymentHistory && Array.isArray(bill.paymentHistory)) {
        bill.paymentHistory.forEach((payment, idx) => {
          const paidByMember = memberLookup[payment.paidBy];
          acts.push({
            id: `bill-${bill.id}-payment-${idx}`,
            type: 'rent-bill',
            action: 'payment',
            entity: bill,
            payment: payment,
            user: paidByMember,
            timestamp: payment.paidAt || payment.date,
            icon: DollarSign,
            color: 'text-green-500'
          });
        });
      }
    });

    // Filter out activities with invalid timestamps and sort by timestamp descending
    const validActs = acts.filter(act => {
      const date = safeDate(act.timestamp);
      return date !== null;
    });
    
    validActs.sort((a, b) => {
      const dateA = safeDate(a.timestamp);
      const dateB = safeDate(b.timestamp);
      if (!dateA || !dateB) return 0;
      return dateB - dateA;
    });

    return validActs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, debts, rentBills, memberLookup]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="Loading activity..." />
        </div>
      </Layout>
    );
  }

  // Helper to render expense breakdown
  const renderExpenseBreakdown = (expense) => {
    const totalAmount = getExpenseTotalAmount(expense);
    const items = expense.items || [{ name: expense.item || 'Item', amount: expense.amount || totalAmount, buyer: expense.buyer }];
    const sharedAmong = expense.sharedAmong || [];
    const buyers = items.map(item => memberLookup[item.buyer]).filter(Boolean);
    const sharedMembers = sharedAmong.map(uid => memberLookup[uid]).filter(Boolean);
    
    return (
      <div className="mt-3 p-3 bg-accent rounded-lg space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-semibold ml-2">৳{totalAmount.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={expense.status === 'approved' ? 'success' : expense.status === 'rejected' ? 'danger' : 'warning'} className="ml-2">
              {expense.status}
            </Badge>
          </div>
        </div>
        
        {items.length > 0 && (
          <div>
            <span className="text-muted-foreground">Items:</span>
            <div className="mt-1 space-y-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>{item.name}</span>
                  <span className="font-medium">৳{parseFloat(item.amount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {buyers.length > 0 && (
          <div>
            <span className="text-muted-foreground">Paid by:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {buyers.map((buyer, idx) => (
                <Badge key={idx} variant="outline">{getDisplayName(buyer)}</Badge>
              ))}
            </div>
          </div>
        )}

        {sharedMembers.length > 0 && (
          <div>
            <span className="text-muted-foreground">Shared among:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {sharedMembers.map((member, idx) => (
                <Badge key={idx} variant="outline">{getDisplayName(member)}</Badge>
              ))}
            </div>
          </div>
        )}

        {expense.notes && (
          <div>
            <span className="text-muted-foreground">Notes:</span>
            <p className="mt-1 text-muted-foreground italic">{expense.notes}</p>
          </div>
        )}
      </div>
    );
  };

  // Helper to render debt breakdown
  const renderDebtBreakdown = (debt) => {
    const debtor = memberLookup[debt.debtor];
    const creditor = memberLookup[debt.creditor];
    const existingPayments = Array.isArray(debt.payments) ? debt.payments : [];
    const totalPaid = existingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const remaining = Math.max(0, (debt.originalAmount || 0) - totalPaid);
    const percentPaid = debt.originalAmount > 0 ? ((totalPaid / debt.originalAmount) * 100) : 0;
    
    return (
      <div className="mt-3 p-3 bg-accent rounded-lg space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-muted-foreground">Original Amount:</span>
            <span className="font-semibold ml-2">৳{(debt.originalAmount || 0).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Remaining:</span>
            <span className={`font-semibold ml-2 ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ৳{remaining.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div>
          <span className="text-muted-foreground">Debtor:</span>
          <span className="font-medium ml-2">{getDisplayName(debtor)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Creditor:</span>
          <span className="font-medium ml-2">{getDisplayName(creditor)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Reason:</span>
          <span className="ml-2">{debt.reason}</span>
        </div>
        
        {debt.type && (
          <div>
            <span className="text-muted-foreground">Type:</span>
            <Badge variant={debt.type === 'auto' ? 'secondary' : 'outline'} className="ml-2">
              {debt.type === 'auto' ? '⚡ Auto' : '👤 Manual'}
            </Badge>
          </div>
        )}

        {existingPayments.length > 0 && (
          <div>
            <span className="text-muted-foreground">Payment History ({existingPayments.length}):</span>
            <div className="mt-1 space-y-1">
              {existingPayments.map((payment, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                    <span>{safeFormat(payment.date, 'MMM dd, yyyy')}</span>
                    <span className="font-medium text-green-600">+৳{parseFloat(payment.amount || 0).toFixed(2)}</span>
                  </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="text-muted-foreground">Progress:</span>
          <div className="mt-1">
            <div className="flex justify-between text-xs mb-1">
              <span>{percentPaid.toFixed(0)}%</span>
              <span>৳{totalPaid.toFixed(2)} / ৳{(debt.originalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-full rounded-full ${percentPaid === 100 ? 'bg-green-600' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, percentPaid)}%` }}
              />
            </div>
          </div>
        </div>

        {debt.notes && (
          <div>
            <span className="text-muted-foreground">Notes:</span>
            <p className="mt-1 text-muted-foreground italic">{debt.notes}</p>
          </div>
        )}
      </div>
    );
  };

  // Helper to render rent/bill breakdown
  const renderRentBillBreakdown = (bill) => {
    const categories = bill.categories || [];
    const memberBreakdown = bill.memberBreakdown || [];
    const memberCategoryAmounts = bill.memberCategoryAmounts || {};
    const memberCategoryPayments = bill.memberCategoryPayments || {};
    
    return (
      <div className="mt-3 p-3 bg-accent rounded-lg space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-semibold ml-2">৳{(bill.totalAmount || 0).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Paid Amount:</span>
            <span className="font-semibold ml-2 text-green-600">৳{(bill.paidAmount || 0).toFixed(2)}</span>
          </div>
        </div>

        <div>
          <span className="text-muted-foreground">Status:</span>
          <Badge 
            variant={bill.status === 'paid' ? 'success' : bill.status === 'partial' ? 'warning' : 'danger'} 
            className="ml-2"
          >
            {bill.status || 'unpaid'}
          </Badge>
        </div>

        {bill.dueDate && (
          <div>
            <span className="text-muted-foreground">Due Date:</span>
            <span className="ml-2">{safeFormat(bill.dueDate, 'MMM dd, yyyy')}</span>
          </div>
        )}

        {categories.length > 0 && (
          <div>
            <span className="text-muted-foreground">Categories:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {categories.map((cat, idx) => (
                <Badge key={idx} variant="outline">{cat}</Badge>
              ))}
            </div>
          </div>
        )}

        {memberBreakdown.length > 0 && (
          <div>
            <span className="text-muted-foreground">Member Breakdown:</span>
            <div className="mt-1 space-y-2">
              {memberBreakdown.map((memberData, idx) => {
                const member = memberLookup[memberData.memberId];
                if (!member) return null;
                const memberAmounts = memberCategoryAmounts[memberData.memberId] || {};
                const memberPayments = memberCategoryPayments[memberData.memberId] || {};
                const totalOwed = Object.values(memberAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
                const totalPaid = Object.values(memberPayments).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
                const remaining = totalOwed - totalPaid;
                
                return (
                  <div key={idx} className="p-2 bg-background rounded border border-border">
                    <div className="font-medium">{getDisplayName(member)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Owed: ৳{totalOwed.toFixed(2)} • Paid: ৳{totalPaid.toFixed(2)} • Remaining: ৳{remaining.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {bill.description && (
          <div>
            <span className="text-muted-foreground">Description:</span>
            <p className="mt-1 text-muted-foreground italic">{bill.description}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Activity Log</h1>
          <p className="text-muted-foreground">
            Detailed breakdown of all household activities
          </p>
        </div>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                <p className="text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => {
                  const Icon = activity.icon;
                  const isExpanded = expandedActivities.has(activity.id);
                  let actionText = '';
                  let entityName = '';

                  // Determine action text and entity name based on type
                  if (activity.type === 'expense') {
                    const expense = activity.entity;
                    const items = expense.items || [{ name: expense.item || 'Item' }];
                    entityName = items.map(item => item.name).join(', ');
                    if (activity.action === 'created') actionText = 'added expense';
                    else if (activity.action === 'approved') actionText = 'approved expense';
                    else if (activity.action === 'rejected') actionText = 'rejected expense';
                  } else if (activity.type === 'debt') {
                    const debt = activity.entity;
                    const debtor = memberLookup[debt.debtor];
                    const creditor = memberLookup[debt.creditor];
                    if (activity.action === 'created') actionText = 'created debt';
                    else if (activity.action === 'approved') actionText = 'approved debt';
                    else if (activity.action === 'rejected') actionText = 'rejected debt';
                    else if (activity.action === 'payment') {
                      actionText = 'recorded payment for debt';
                      entityName = `${getDisplayName(debtor)} → ${getDisplayName(creditor)}`;
                    } else if (activity.action === 'paid') {
                      actionText = 'fully paid debt';
                      entityName = `${getDisplayName(debtor)} → ${getDisplayName(creditor)}`;
                    }
                  } else if (activity.type === 'rent-bill') {
                    const bill = activity.entity;
                    entityName = `Bill (${bill.categories?.join(', ') || 'Rent & Bills'})`;
                    if (activity.action === 'created') actionText = 'created bill';
                    else if (activity.action === 'payment') actionText = 'recorded payment for bill';
                  }

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <div
                        className="flex gap-4 p-4 bg-accent hover:bg-accent/80 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(activity.id)}
                      >
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-background flex items-center justify-center ${activity.color}`}>
                          <Icon size={20} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium">
                                <span className="text-foreground">{getDisplayName(activity.user) || 'Someone'}</span>
                                {' '}
                                <span className="text-muted-foreground">{actionText}</span>
                                {' '}
                                <span className="text-primary">{entityName}</span>
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {safeFormat(activity.timestamp, 'MMM dd, yyyy HH:mm')}
                              </p>
                              {activity.payment && (
                                <p className="text-sm font-medium text-green-600 mt-1">
                                  Payment: ৳{parseFloat(activity.payment.amount || 0).toFixed(2)}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Status Badge */}
                              <Badge
                                variant={
                                  activity.action === 'created' ? 'default' :
                                  activity.action === 'approved' || activity.action === 'paid' || activity.action === 'payment' ? 'success' : 'danger'
                                }
                              >
                                {activity.action}
                              </Badge>
                              {/* Expand/Collapse Icon */}
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Breakdown */}
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-background border-t border-border">
                            {activity.type === 'expense' && renderExpenseBreakdown(activity.entity)}
                            {activity.type === 'debt' && renderDebtBreakdown(activity.entity)}
                            {activity.type === 'rent-bill' && renderRentBillBreakdown(activity.entity)}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Activity;

