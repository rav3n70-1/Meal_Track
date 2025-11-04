// Component to show detailed debt information and breakdown
import React from 'react';
import { format } from 'date-fns';
import { 
  Calendar,
  User,
  FileText,
  DollarSign,
  Receipt,
  ArrowRight
} from 'lucide-react';
import { getDisplayName } from '../../utils/displayName';
import { roundDebtToNearestTen, roundUpSharedAmount } from '../../utils/calculations';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';

const DebtDetails = ({ debt, isOpen, onClose, expenses = [] }) => {
  const { currentUser } = useAuth();
  const { members } = useHousehold();

  if (!debt) return null;

  // Create member lookup
  const memberLookup = {};
  members.forEach(member => {
    memberLookup[member.uid] = member;
  });

  const debtor = memberLookup[debt.debtor];
  const creditor = memberLookup[debt.creditor];
  const isMyDebt = debt.debtor === currentUser?.uid;

  // Calculate breakdown for the debt
  const getDebtBreakdown = () => {
    // For auto debts, we need to find contributing expenses
    if (debt.type === 'auto') {
      // Find expenses that contributed to this debt
      const contributingExpenses = expenses.filter(exp => {
        if (exp.status !== 'approved') return false;
        const sharedAmong = exp.sharedAmong || [];
        if (!sharedAmong.includes(debt.debtor) || !sharedAmong.includes(debt.creditor)) return false;
        
        // Check if this expense contributes to the debt
        const items = exp.items || [{ name: exp.item, amount: exp.amount, buyer: exp.buyer }];
        return items.some(item => item.buyer === debt.creditor);
      });

      if (contributingExpenses.length > 0) {
        // Calculate total from expenses
        let totalUnrounded = 0;
        const expenseDetails = [];

        contributingExpenses.forEach(expense => {
          const items = expense.items || [{ name: expense.item, amount: expense.amount, buyer: expense.buyer }];
          items.forEach(item => {
            if (item.buyer === debt.creditor) {
              const sharedAmong = expense.sharedAmong || [];
              if (sharedAmong.includes(debt.debtor)) {
                const shareCalc = roundUpSharedAmount(parseFloat(item.amount), sharedAmong.length);
                totalUnrounded += shareCalc.exact;
                expenseDetails.push({
                  expense,
                  item,
                  shareCalc
                });
              }
            }
          });
        });

        // Round the total to nearest 10
        const debtRounding = roundDebtToNearestTen(totalUnrounded);
        
        return {
          type: 'auto',
          totalUnrounded,
          debtRounding,
          expenseDetails,
          calculation: debt.calculation || debtRounding.calculation
        };
      }
    }

    // For manual debts or if we can't find expenses, show simple rounding
    if (debt.originalAmount) {
      // We need to reverse engineer or show what we have
      const debtRounding = roundDebtToNearestTen(debt.originalAmount);
      return {
        type: debt.type || 'manual',
        debtRounding,
        calculation: debt.calculation || debtRounding.calculation
      };
    }

    return null;
  };

  const breakdown = getDebtBreakdown();
  
  // Calculate actual remaining amount from payments (more reliable than stored value)
  const existingPayments = Array.isArray(debt.payments) ? debt.payments : [];
  const totalPaid = existingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const actualRemaining = Math.max(0, (debt.originalAmount || 0) - totalPaid);
  const percentPaid = debt.originalAmount > 0 
    ? ((totalPaid / debt.originalAmount) * 100)
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Debt Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Status and Type */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {debt.type === 'auto' ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <span>⚡</span> Auto
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <User size={12} /> Manual
              </Badge>
            )}
          </div>
        </div>

        {/* Debt Relationship */}
        <div className="bg-accent rounded-lg p-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex flex-col items-center gap-2">
              <div className={`p-3 rounded-full ${isMyDebt ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <User className={isMyDebt ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'} size={24} />
              </div>
              <span className={`font-semibold ${isMyDebt ? 'text-red-600 dark:text-red-400' : ''}`}>
                {getDisplayName(debtor)}
              </span>
              <span className="text-xs text-muted-foreground">Debtor</span>
            </div>
            <ArrowRight className="text-muted-foreground" size={24} />
            <div className="flex flex-col items-center gap-2">
              <div className={`p-3 rounded-full ${!isMyDebt ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <User className={!isMyDebt ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'} size={24} />
              </div>
              <span className={`font-semibold ${!isMyDebt ? 'text-green-600 dark:text-green-400' : ''}`}>
                {getDisplayName(creditor)}
              </span>
              <span className="text-xs text-muted-foreground">Creditor</span>
            </div>
          </div>
        </div>

        {/* Amount Info */}
        <div className="bg-accent rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Original Amount:</span>
            <span className="font-bold text-primary text-xl">
              ৳{(debt.originalAmount || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Paid:</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              ৳{totalPaid.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Remaining:</span>
            <span className="font-bold text-lg">
              {actualRemaining > 0 ? (
                <span className="text-red-600 dark:text-red-400">
                  ৳{actualRemaining.toFixed(2)}
                </span>
              ) : (
                <span className="text-green-600 dark:text-green-400">
                  ৳0.00
                </span>
              )}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span className="font-semibold">{percentPaid.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percentPaid === 100 
                    ? 'bg-green-600' 
                    : 'bg-gradient-to-r from-yellow-500 to-primary'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, percentPaid))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Calculation Breakdown */}
        {breakdown && (
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-3">
            <p className="text-sm font-medium text-primary">Calculation Breakdown:</p>
            
            {breakdown.type === 'auto' && breakdown.expenseDetails && breakdown.expenseDetails.length > 0 ? (
              <div className="space-y-4">
                {/* Show each contributing expense */}
                {breakdown.expenseDetails.map((detail, idx) => (
                  <div key={idx} className="p-3 bg-background rounded border border-border space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <Receipt size={14} />
                      <span>{detail.item.name || 'Item'}</span>
                      <span className="text-muted-foreground">
                        ({format(new Date(detail.expense.date), 'MMM dd, yyyy')})
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground pl-5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Item amount:</span>
                        <span>৳{parseFloat(detail.item.amount).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Shared among:</span>
                        <span>{detail.expense.sharedAmong?.length || 0} people</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Exact share:</span>
                        <span>৳{detail.shareCalc.exact.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <span className="font-medium">Rounded:</span>
                        <span>৳{detail.shareCalc.exact.toFixed(2)} + ৳{detail.shareCalc.difference.toFixed(2)} = ৳{detail.shareCalc.rounded.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total calculation */}
                {breakdown.totalUnrounded !== undefined && breakdown.debtRounding && (
                  <div className="pt-3 border-t border-primary/20 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <span>Total before rounding:</span>
                      <span>৳{breakdown.totalUnrounded.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <span>Rounded to nearest 10:</span>
                      <span>৳{breakdown.debtRounding.original.toFixed(2)} → ৳{breakdown.debtRounding.rounded.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Manual debt or simple breakdown */
              breakdown.debtRounding && (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Original amount:</span>
                    <span>৳{breakdown.debtRounding.original.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <span className="font-medium">Rounded to nearest 10:</span>
                    <span>৳{breakdown.debtRounding.original.toFixed(2)} → ৳{breakdown.debtRounding.rounded.toFixed(2)}</span>
                  </div>
                </div>
              )
            )}

            <div className="pt-2 border-t border-primary/20 text-xs italic text-muted-foreground">
              This rounding up is necessary to make calculations and debt payment easier
            </div>
          </div>
        )}

        {/* Source Info */}
        {debt.type === 'auto' && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Receipt size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p>
                This debt was automatically calculated from shared expenses where{' '}
                <span className="font-medium">{getDisplayName(debtor)}</span> consumed{' '}
                their share but{' '}
                <span className="font-medium">{getDisplayName(creditor)}</span> paid.
              </p>
            </div>
          </div>
        )}

        {/* Date */}
        <div className="flex items-start gap-3 p-3 bg-accent rounded-lg">
          <Calendar className="text-primary mt-1" size={20} />
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">
              {format(new Date(debt.date), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>

        {/* Reason and Notes */}
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">Reason</h4>
            <p className="text-sm text-muted-foreground">{debt.reason}</p>
          </div>
          {debt.notes && (
            <div>
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                <FileText size={14} /> Notes
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {debt.notes}
              </p>
            </div>
          )}
        </div>

        {/* Payment History */}
        {debt.payments && debt.payments.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Payment History ({debt.payments.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {debt.payments.map((payment, idx) => {
                const paidByMember = memberLookup[payment.paidBy];
                return (
                  <div 
                    key={idx}
                    className="p-3 bg-accent rounded-lg flex justify-between items-center"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {format(new Date(payment.date), 'MMM dd, yyyy')}
                      </span>
                      {paidByMember && (
                        <span className="text-xs text-muted-foreground">
                          Paid by {getDisplayName(paidByMember)}
                        </span>
                      )}
                      {payment.notes && (
                        <span className="text-xs text-muted-foreground italic">
                          {payment.notes}
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      +৳{payment.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DebtDetails;
