// List component for displaying Rent and Bills
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, DollarSign, Calendar, CheckCircle, AlertCircle, Clock, Wallet, Printer } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import RentBillForm from './RentBillForm';
import Input from '../ui/Input';
import { useRentBills } from '../../context/RentBillsContext';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import { getDisplayName } from '../../utils/displayName';
import { generateRentBillReceipt, generateBillSummaryPdf } from '../../utils/exportData';
import toast from 'react-hot-toast';

const RentBillList = ({ filterMemberId = null }) => {
  const { currentUser } = useAuth();
  const { getUserRole, members, household } = useHousehold();
  const { rentBills, deleteRentBill, rentBillMembers, recordPayment } = useRentBills();
  const [selectedBill, setSelectedBill] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const role = getUserRole();
  const isManager = role === 'manager';

  // Filter bills
  const filteredBills = useMemo(() => {
    let filtered = rentBills;

    // Filter by member
    if (filterMemberId) {
      filtered = filtered.filter(bill => bill.memberId === filterMemberId);
    }

    // For non-managers, only show bills where they are a member
    if (!isManager && currentUser) {
      filtered = filtered.filter(bill => {
        // Check if current user is in member breakdown
        if (bill.memberBreakdown) {
          return bill.memberBreakdown.some(m => m.memberId === currentUser.uid);
        }
        return false;
      });
    }

    return filtered;
  }, [rentBills, filterMemberId, isManager, currentUser]);

  const handleEdit = (bill) => {
    setSelectedBill(bill);
    setShowEditModal(true);
  };

  const handleDelete = async (bill) => {
    if (!window.confirm(`Are you sure you want to delete this bill?`)) return;

    try {
      await deleteRentBill(bill.id);
      toast.success('Bill deleted successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to delete bill');
    }
  };

  // Combine household members and rent-only members
  const allMembers = useMemo(() => [
    ...members.map(m => ({ ...m, isRentOnly: false })),
    ...rentBillMembers.map(m => ({ ...m, isRentOnly: true }))
  ], [members, rentBillMembers]);

  const handlePayment = (bill) => {
    setSelectedBill(bill);
    setShowPaymentModal(true);
    // Initialize payment amounts
    const initialAmounts = {};
    if (bill.memberCategoryAmounts) {
      allMembers.forEach(member => {
        initialAmounts[member.uid] = {};
        if (bill.categories) {
          bill.categories.forEach(category => {
            initialAmounts[member.uid][category] = '';
          });
        }
      });
    }
    setPaymentAmounts(initialAmounts);
    setPaymentNotes('');
  };

  const handlePaymentAmountChange = (memberId, category, amount) => {
    setPaymentAmounts(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [category]: amount
      }
    }));
  };

  const calculateTotalPayment = () => {
    return Object.values(paymentAmounts).reduce((total, memberPayments) => {
      return total + Object.values(memberPayments).reduce((sum, amt) => {
        return sum + (parseFloat(amt) || 0);
      }, 0);
    }, 0);
  };

  const handlePrintReceipt = (member) => {
    if (!selectedBill) return;
    
    try {
      const memberAmounts = selectedBill.memberCategoryAmounts[member.uid] || {};
      
      // Combine existing payments with new payment amounts
      const existingPayments = selectedBill.memberCategoryPayments?.[member.uid] || {};
      const newPayments = paymentAmounts[member.uid] || {};
      const combinedPayments = { ...existingPayments };
      
      Object.entries(newPayments).forEach(([category, amount]) => {
        const numericAmount = parseFloat(amount) || 0;
        if (numericAmount > 0) {
          combinedPayments[category] = (combinedPayments[category] || 0) + numericAmount;
        }
      });
      
      generateRentBillReceipt(
        { ...selectedBill, householdName: household?.name },
        member,
        memberAmounts,
        combinedPayments,
        `receipt-${selectedBill.description.replace(/\s+/g, '-')}-${member.name.replace(/\s+/g, '-')}.pdf`
      );
      toast.success('Receipt generated successfully');
    } catch (error) {
      toast.error('Failed to generate receipt');
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    if (!selectedBill) return;

    const totalPayment = calculateTotalPayment();
    if (totalPayment <= 0) {
      toast.error('Please enter at least one payment amount');
      return;
    }

    const remaining = (selectedBill.totalAmount || 0) - (selectedBill.paidAmount || 0);
    if (totalPayment > remaining) {
      toast.error(`Total payment cannot exceed remaining balance of ৳${remaining.toFixed(2)}`);
      return;
    }

    setPaymentLoading(true);
    try {
      await recordPayment(selectedBill.id, totalPayment, paymentNotes, paymentAmounts);
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentAmounts({});
      setPaymentNotes('');
      setSelectedBill(null);
    } catch (error) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success"><CheckCircle size={14} /> Paid</Badge>;
      case 'partial':
        return <Badge variant="warning"><Clock size={14} /> Partial</Badge>;
      case 'unpaid':
        return <Badge variant="danger"><AlertCircle size={14} /> Unpaid</Badge>;
      default:
        return <Badge variant="warning"><Clock size={14} /> Pending</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="space-y-4">

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
            <p>No bills found</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredBills.map((bill, index) => (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`p-4 ${isOverdue(bill.dueDate) && bill.status !== 'paid' ? 'border-red-500 border-2' : ''}`}>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {bill.description || 'Bill'}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Created by: {bill.createdByName || 'Manager'}
                          </p>
                        </div>
                        {bill.status && getStatusBadge(bill.status)}
                      </div>

                      {/* Member Breakdown with per-member status */}
                      {bill.memberBreakdown && bill.memberBreakdown.length > 0 && (
                        <div className="space-y-1">
                          {bill.memberBreakdown
                            .filter(member => isManager || member.memberId === currentUser?.uid)
                            .map((member, idx) => {
                              const memberAmounts = bill.memberCategoryAmounts?.[member.memberId] || {};
                              const memberPaidMap = bill.memberCategoryPayments?.[member.memberId] || {};
                              const memberTotal = Object.values(memberAmounts).reduce((s, a) => s + (parseFloat(a) || 0), 0);
                              const memberPaid = Object.values(memberPaidMap).reduce((s, a) => s + (parseFloat(a) || 0), 0);
                              const isPaid = memberPaid >= memberTotal && memberTotal > 0;
                              const isUnpaid = memberPaid <= 0 && memberTotal > 0;
                              const isPartial = !isPaid && !isUnpaid && memberTotal > 0;
                              return (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center gap-2">
                                    {member.memberName}
                                    {isManager ? (
                                      isPaid ? (
                                        <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Paid</span>
                                      ) : isUnpaid ? (
                                        <span className="text-red-600 flex items-center gap-1"><AlertCircle size={14} /> Unpaid</span>
                                      ) : (
                                        <span className="text-orange-600 flex items-center gap-1"><Clock size={14} /> Partial</span>
                                      )
                                    ) : (
                                      isPaid ? (
                                        <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Paid</span>
                                      ) : isUnpaid ? (
                                        <span className="text-red-600 flex items-center gap-1"><AlertCircle size={14} /> Unpaid</span>
                                      ) : (
                                        <span className="text-orange-600 flex items-center gap-1"><Clock size={14} /> Partial</span>
                                      )
                                    )}
                                  </span>
                                  <span className="font-semibold flex items-center gap-2">
                                    {isPartial && (
                                      <span className="text-red-600 text-xs">(Paid: ৳{memberPaid.toFixed(2)})</span>
                                    )}
                                    ৳{memberTotal.toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* Category Breakdown for non-managers */}
                      {!isManager && currentUser && bill.categories && bill.memberCategoryAmounts?.[currentUser.uid] && (
                        <div className="space-y-1 pt-2 border-t border-border">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Breakdown:</p>
                          {bill.categories.map((category, idx) => {
                            const amount = bill.memberCategoryAmounts[currentUser.uid][category] || 0;
                            const paid = bill.memberCategoryPayments?.[currentUser.uid]?.[category] || 0;
                            const paidAmount = parseFloat(paid) || 0;
                            const dueAmount = parseFloat(amount) || 0;
                            
                            if (dueAmount <= 0) return null;
                            
                            return (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{category}:</span>
                                <div className="flex items-center gap-2">
                                  {paidAmount > 0 && paidAmount < dueAmount && (
                                    <span className="text-xs text-orange-600">(Paid: ৳{paidAmount.toFixed(2)})</span>
                                  )}
                                  {paidAmount >= dueAmount && (
                                    <span className="text-xs text-green-600">(Paid)</span>
                                  )}
                                  <span className="font-semibold">৳{dueAmount.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm">
                        {(() => {
                          // Calculate member's total amount and paid amount
                          let memberTotal = 0;
                          let memberPaid = 0;
                          
                          if (!isManager && currentUser && bill.memberCategoryAmounts?.[currentUser.uid]) {
                            Object.entries(bill.memberCategoryAmounts[currentUser.uid]).forEach(([category, amount]) => {
                              memberTotal += parseFloat(amount) || 0;
                              memberPaid += parseFloat(bill.memberCategoryPayments?.[currentUser.uid]?.[category]) || 0;
                            });
                          }
                          
                          return (
                            <>
                              <div className="flex items-center gap-1">
                                <DollarSign size={16} className="text-muted-foreground" />
                                <span className="font-semibold">
                                  Total: ৳{isManager ? (bill.totalAmount || 0).toFixed(2) : memberTotal.toFixed(2)}
                                </span>
                              </div>
                              {(isManager ? bill.paidAmount : memberPaid) > 0 && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle size={16} />
                                  <span>Paid: ৳{isManager ? bill.paidAmount.toFixed(2) : memberPaid.toFixed(2)}</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                        <div className="flex items-center gap-1">
                          <Calendar size={16} className="text-muted-foreground" />
                          <span className={isOverdue(bill.dueDate) && bill.status !== 'paid' ? 'text-red-600 font-semibold' : ''}>
                            Due: {formatDate(bill.dueDate)}
                            {isOverdue(bill.dueDate) && bill.status !== 'paid' && ' (Overdue!)'}
                          </span>
                        </div>
                      </div>

                      {bill.notes && (
                        <p className="text-xs text-muted-foreground italic">
                          Note: {bill.notes}
                        </p>
                      )}

                      {(() => {
                        let memberTotal = 0;
                        let memberPaid = 0;
                        
                        if (!isManager && currentUser && bill.memberCategoryAmounts?.[currentUser.uid]) {
                          Object.entries(bill.memberCategoryAmounts[currentUser.uid]).forEach(([category, amount]) => {
                            memberTotal += parseFloat(amount) || 0;
                            memberPaid += parseFloat(bill.memberCategoryPayments?.[currentUser.uid]?.[category]) || 0;
                          });
                        }
                        
                        const totalAmount = isManager ? (bill.totalAmount || 0) : memberTotal;
                        const paidAmount = isManager ? bill.paidAmount : memberPaid;
                        const remaining = totalAmount - paidAmount;
                        
                        return paidAmount > 0 && paidAmount < totalAmount ? (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Remaining: </span>
                            <span className="font-semibold text-red-600">
                              ৳{remaining.toFixed(2)}
                            </span>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Actions - Only show to managers */}
                    {isManager && (
                      <div className="flex sm:flex-col gap-2">
                        {bill.status !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => handlePayment(bill)}
                            icon={<Wallet size={16} />}
                          >
                            Record Payment
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateBillSummaryPdf(bill, allMembers, household?.name)}
                          icon={<Printer size={16} />}
                        >
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(bill)}
                          icon={<Edit2 size={16} />}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(bill)}
                          icon={<Trash2 size={16} />}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBill(null);
        }}
        title="Edit Bill"
        size="lg"
      >
        <RentBillForm
          bill={selectedBill}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedBill(null);
          }}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedBill(null);
          }}
        />
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedBill(null);
          setPaymentAmounts({});
          setPaymentNotes('');
        }}
        title="Record Payment"
        size="xl"
      >
        {selectedBill && selectedBill.categories && (
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div className="bg-accent rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Bill Details</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{selectedBill.description || 'Bill'}</span>
                <span className="text-primary font-bold">৳{(selectedBill.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Already Paid:</span>
                <span className="text-green-600 font-semibold">৳{(selectedBill.paidAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="text-red-600 font-semibold">
                  ৳{((selectedBill.totalAmount || 0) - (selectedBill.paidAmount || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold border-r border-border">Member</th>
                      {selectedBill.categories.map((category) => (
                        <th key={category} className="px-4 py-3 text-left text-sm font-semibold border-r border-border">
                          {category}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-sm font-semibold bg-primary/10">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMembers.map((member, memberIdx) => (
                      <tr key={member.uid} className={`border-t border-border ${memberIdx % 2 === 0 ? 'bg-background' : 'bg-accent/30'}`}>
                        <td className="px-4 py-3 border-r border-border font-medium">
                          <div className="flex items-center gap-2">
                            {getDisplayName(member)}
                            {member.isRentOnly && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Rent Only</span>
                            )}
                          </div>
                        </td>
                        {selectedBill.categories.map((category) => {
                          const dueAmount = selectedBill.memberCategoryAmounts?.[member.uid]?.[category] || 0;
                          const paidAmount = selectedBill.memberCategoryPayments?.[member.uid]?.[category] || 0;
                          const remaining = Math.max(0, parseFloat(dueAmount) - parseFloat(paidAmount));
                          return (
                            <td key={category} className="px-4 py-3 border-r border-border">
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={remaining}
                                  value={paymentAmounts[member.uid]?.[category] || ''}
                                  onChange={(e) => handlePaymentAmountChange(member.uid, category, e.target.value)}
                                  className="w-full px-2 py-1 rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                  placeholder={`৳${remaining.toFixed(2)}`}
                                />
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 bg-primary/10 font-semibold">
                          <div className="flex items-center justify-between">
                            <span>৳{Object.values(paymentAmounts[member.uid] || {}).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0).toFixed(2)}</span>
                            {/* Print button - always show for members with amounts */}
                            {Object.values(selectedBill.memberCategoryAmounts?.[member.uid] || {}).some(amt => parseFloat(amt) > 0) && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintReceipt(member)}
                                icon={<Printer size={14} />}
                                className="ml-2"
                              >
                                Print
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-accent border-t-2 border-primary">
                    <tr>
                      <td className="px-4 py-3 font-bold border-r border-border">Total Payment</td>
                      {selectedBill.categories.map((category) => (
                        <td key={category} className="px-4 py-3 font-bold border-r border-border text-primary">
                          ৳{allMembers.reduce((sum, member) => sum + (parseFloat(paymentAmounts[member.uid]?.[category]) || 0), 0).toFixed(2)}
                        </td>
                      ))}
                      <td className="px-4 py-3 font-bold bg-primary/20 text-primary">
                        ৳{calculateTotalPayment().toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Payment Notes (Optional)</label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any notes about this payment..."
                className="w-full px-4 py-2 rounded-lg border border-input bg-background resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={paymentLoading}
                className="flex-1"
                icon={<Wallet size={18} />}
              >
                {paymentLoading ? 'Recording...' : 'Record Payment'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBill(null);
                  setPaymentAmounts({});
                  setPaymentNotes('');
                }}
                disabled={paymentLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};

export default RentBillList;

