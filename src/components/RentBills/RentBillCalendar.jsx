// Manager calendar marking months when rent was fully paid
import React, { useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { CheckCircle, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { useRentBills } from '../../context/RentBillsContext';

const monthLabel = (date) => date.toLocaleDateString('en-US', { month: 'short' });

const RentBillCalendar = () => {
  const { rentBills } = useRentBills();

  const months = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const arr = [];
    for (let m = 0; m < 12; m++) {
      arr.push(new Date(year, m, 1));
    }
    return arr;
  }, []);

  // Aggregate per month: consider bills due in that month
  const perMonth = useMemo(() => {
    const map = {};
    months.forEach((d) => {
      const key = d.getFullYear() + '-' + d.getMonth();
      map[key] = { total: 0, paid: 0, count: 0, paidCount: 0 };
    });

    rentBills.forEach((bill) => {
      if (!bill.dueDate) return;
      const d = new Date(bill.dueDate);
      const key = d.getFullYear() + '-' + d.getMonth();
      if (!map[key]) return;
      map[key].total += bill.totalAmount || 0;
      map[key].paid += bill.paidAmount || 0;
      map[key].count += 1;
      if (bill.status === 'paid') map[key].paidCount += 1;
    });

    return map;
  }, [rentBills, months]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} />
          <CardTitle>Payment Calendar</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {months.map((d, idx) => {
            const key = d.getFullYear() + '-' + d.getMonth();
            const info = perMonth[key];
            const fullyPaid = info && info.count > 0 && info.paid >= info.total && info.total > 0;
            const hasAny = info && info.count > 0;
            return (
              <div key={idx} className={`p-3 rounded border ${fullyPaid ? 'border-green-500 bg-green-500/10' : hasAny ? 'border-amber-500 bg-amber-500/10' : 'border-border'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{monthLabel(d)}</span>
                  {fullyPaid ? (
                    <Badge variant="success" size="sm"><CheckCircle size={12} /> Paid</Badge>
                  ) : hasAny ? (
                    <Badge variant="warning" size="sm"><AlertCircle size={12} /> Pending</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">No bills</span>
                  )}
                </div>
                {hasAny && (
                  <div className="text-xs mt-2">
                    <div>Total: ৳{(info.total || 0).toFixed(2)}</div>
                    <div>Paid: ৳{(info.paid || 0).toFixed(2)}</div>
                    <div>Paid Bills: {info.paidCount}/{info.count}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RentBillCalendar;


