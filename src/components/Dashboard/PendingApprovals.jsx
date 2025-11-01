// Component for managers to see and approve pending expenses
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import ExpenseDetails from '../Expenses/ExpenseDetails';
import { useHousehold } from '../../context/HouseholdContext';
import { getDisplayName } from '../../utils/displayName';

const PendingApprovals = ({ expenses }) => {
  const { members } = useHousehold();
  const [selectedExpense, setSelectedExpense] = useState(null);

  const pendingExpenses = expenses.filter(exp => exp.status === 'pending');

  // Create member lookup
  const memberLookup = {};
  members.forEach(member => {
    memberLookup[member.uid] = member;
  });

  if (pendingExpenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={24} />
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No pending approvals</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="text-yellow-500" size={24} />
            Pending Approvals ({pendingExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingExpenses.map((expense, index) => {
            // Support both old and new format
            const items = expense.items || [{ name: expense.item, amount: expense.amount, buyer: expense.buyer }];
            const totalAmount = expense.totalAmount || expense.amount;
            const displayText = items.length > 1 
              ? `${items[0].name} and ${items.length - 1} more item${items.length > 2 ? 's' : ''}`
              : items[0].name;

            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-accent rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-semibold">{displayText}</h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {format(new Date(expense.date), 'MMM dd')}
                    </span>
                    {items.length === 1 && <span>by {getDisplayName(memberLookup[items[0].buyer])}</span>}
                    {items.length > 1 && <span>{items.length} items</span>}
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      ৳{parseFloat(totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedExpense(expense)}
                >
                  Review
                </Button>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      <ExpenseDetails
        expense={selectedExpense}
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
    </>
  );
};

export default PendingApprovals;

