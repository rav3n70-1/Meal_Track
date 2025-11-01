// Modal component showing detailed balance breakdown
import React from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Receipt, CreditCard } from 'lucide-react';
import Modal from '../ui/Modal';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';

const BalanceDetailsModal = ({ isOpen, onClose, balance, userName }) => {
  if (!balance) return null;

  const balanceItems = [
    {
      icon: Receipt,
      label: 'Total Paid',
      value: balance.totalPaid,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      description: 'Total amount you have paid for expenses'
    },
    {
      icon: TrendingDown,
      label: 'Your Share',
      value: balance.totalShare,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      description: 'Your share of all household expenses'
    },
    {
      icon: CreditCard,
      label: 'Debts You Owe',
      value: balance.totalDebtOwed,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      description: 'Money you owe to other members'
    },
    {
      icon: TrendingUp,
      label: 'Money Owed to You',
      value: balance.totalDebtCredit,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: 'Money other members owe to you'
    }
  ];

  const calculateNetBalance = () => {
    return balance.totalPaid - balance.totalShare + balance.totalDebtCredit - balance.totalDebtOwed;
  };

  const netBalance = calculateNetBalance();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Balance Details - ${userName}`} size="lg">
      <div className="space-y-6">
        {/* Net Balance Summary */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Your Net Balance</p>
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold mb-3"
              >
                {netBalance >= 0 ? (
                  <span className="text-green-600 dark:text-green-400">
                    +৳{netBalance.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    ৳{netBalance.toFixed(2)}
                  </span>
                )}
              </motion.div>
              <p className="text-sm text-muted-foreground">
                {netBalance > 0 
                  ? 'Others owe you money'
                  : netBalance < 0 
                  ? 'You owe money to others'
                  : 'You are all settled up!'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Breakdown</h3>
          {balanceItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 p-4 bg-accent rounded-lg"
            >
              <div className={`p-3 rounded-lg ${item.bgColor}`}>
                <item.icon className={item.color} size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold">{item.label}</h4>
                  <span className={`text-lg font-bold ${item.color}`}>
                    ৳{item.value.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Calculation Explanation */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">How Your Balance is Calculated</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Total Paid</span>
              <span className="font-mono">+৳{balance.totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Your Share</span>
              <span className="font-mono">-৳{balance.totalShare.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Money Owed to You</span>
              <span className="font-mono">+৳{balance.totalDebtCredit.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Debts You Owe</span>
              <span className="font-mono">-৳{balance.totalDebtOwed.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex items-center justify-between font-bold">
                <span>Net Balance</span>
                <span className={`font-mono ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {netBalance >= 0 ? '+' : ''}৳{netBalance.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Expenses Paid</p>
              <p className="text-2xl font-bold text-primary">{balance.expenseCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Active Debts</p>
              <p className="text-2xl font-bold text-primary">{balance.debtCount}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Modal>
  );
};

export default BalanceDetailsModal;

