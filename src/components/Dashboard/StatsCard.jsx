// Stats card component for displaying key metrics
import React from 'react';
import { motion } from 'framer-motion';
import Card, { CardContent } from '../ui/Card';

const StatsCard = ({ title, value, icon: Icon, trend, color = 'primary' }) => {
  const colors = {
    primary: 'text-primary bg-primary/10',
    success: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    warning: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
    danger: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {title}
              </p>
              <h3 className="text-3xl font-bold">{value}</h3>
              {trend && (
                <p className="text-xs text-muted-foreground mt-2">{trend}</p>
              )}
            </div>
            {Icon && (
              <div className={`p-3 rounded-lg ${colors[color]}`}>
                <Icon size={24} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatsCard;

