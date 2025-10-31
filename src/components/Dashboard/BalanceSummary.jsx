// Component showing who owes whom
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, DollarSign } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { calculateDebts } from '../../utils/calculations';

const BalanceSummary = ({ balances }) => {
  const debts = calculateDebts(balances);

  if (debts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Everyone is settled up! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who Owes Whom</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {debts.map((debt, index) => (
          <motion.div
            key={`${debt.from}-${debt.to}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-accent rounded-lg"
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="font-medium">{debt.fromName}</span>
              <ArrowRight className="text-muted-foreground" size={18} />
              <span className="font-medium">{debt.toName}</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-primary">
              <DollarSign size={18} />
              {debt.amount.toFixed(2)}
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default BalanceSummary;

