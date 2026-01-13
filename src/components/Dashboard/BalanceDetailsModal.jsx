// Modal component showing detailed balance breakdown
import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';

const BalanceDetailsModal = ({ isOpen, onClose, balance, userName }) => {
  if (!balance) return null;

  // Only show debt related items
  const balanceItems = [
    {
      icon: CreditCard,
      label: 'Total Debt Owed',
      value: balance.totalDebtOwed,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      description: 'Money you owe to other members'
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Debt Details - ${userName}`} size="lg">
      <div className="space-y-6">
        {/* Net Balance Summary */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Current Debt Status</p>
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold mb-3"
              >
                {balance.totalDebtOwed > 0 ? (
                  <span className="text-red-600 dark:text-red-400">
                    -৳{balance.totalDebtOwed.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-green-600 dark:text-green-400">
                    ৳0.00
                  </span>
                )}
              </motion.div>
              <p className="text-sm text-muted-foreground">
                {balance.totalDebtOwed > 0
                  ? 'You have outstanding debts to clear'
                  : 'You have no debts!'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Debt Breakdown</h3>
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

        {/* Info Note */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <p>
            This view focuses on your debts. Any money owed to you is tracked separately and does not offset your debt obligations in this view.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Active Debts Count</p>
              <p className="text-2xl font-bold text-primary">{balance.debtCount}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Modal>
  );
};

export default BalanceDetailsModal;


