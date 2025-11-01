// Rent and Bills summary component for Dashboard
import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useRentBills } from '../../context/RentBillsContext';

const RentBillSummary = () => {
  const navigate = useNavigate();
  const { rentBills, getStats } = useRentBills();
  const stats = getStats();

  // Get recent bills (last 5)
  const recentBills = rentBills.slice(0, 5);

  // Get overdue bills
  const overdueBills = rentBills.filter(bill => {
    if (bill.status === 'paid') return false;
    if (!bill.dueDate) return false;
    const dueDate = new Date(bill.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" size="sm"><CheckCircle size={12} /> Paid</Badge>;
      case 'partial':
        return <Badge variant="warning" size="sm"><Clock size={12} /> Partial</Badge>;
      case 'unpaid':
        return <Badge variant="danger" size="sm"><AlertCircle size={12} /> Unpaid</Badge>;
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (rentBills.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="text-primary" />
            Rent & Bills
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/rent-bills')}
            icon={<ArrowRight size={16} />}
          >
            View All
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">৳{stats.totalAmount.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">৳{stats.totalPaid.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">৳{stats.totalUnpaid.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Unpaid</p>
            </div>
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <p className="text-2xl font-bold">{stats.totalBills}</p>
              <p className="text-xs text-muted-foreground">Total Bills</p>
            </div>
        </div>

        {/* Overdue Alert */}
        {overdueBills.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle size={18} />
              <span className="font-semibold">
                {overdueBills.length} overdue bill{overdueBills.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Recent Bills */}
        {recentBills.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Bills
            </h3>
            {recentBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-3 bg-accent/30 hover:bg-accent/50 rounded-lg transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{bill.description || 'Bill'}</p>
                    {bill.status && getStatusBadge(bill.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created by: {bill.createdByName || 'Manager'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due: {formatDate(bill.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">৳{(bill.totalAmount || 0).toFixed(2)}</p>
                  {bill.paidAmount > 0 && (
                    <p className="text-xs text-green-600">
                      Paid: ৳{bill.paidAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default RentBillSummary;

