import React, { useState } from 'react';
import { format } from 'date-fns';
import {
    User,
    ArrowRight,
    Receipt,
    DollarSign,
    Calendar,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { getDisplayName } from '../../utils/displayName';
import { useAuth } from '../../context/AuthContext';

const DebtBreakdownModal = ({
    isOpen,
    onClose,
    member,
    debts,
    expenses,
    members,
    onSettle,
    currentUserId
}) => {
    const [expandedDebtId, setExpandedDebtId] = useState(null);

    if (!member) return null;

    // Filter debts involving this member
    const memberDebts = debts.filter(d =>
        (d.debtor === member.uid || d.creditor === member.uid) &&
        d.status === 'approved' &&
        d.remainingAmount > 0
    );

    const debtsOwedByMember = memberDebts.filter(d => d.debtor === member.uid);
    const debtsOwedToMember = memberDebts.filter(d => d.creditor === member.uid);

    const toggleExpand = (id) => {
        setExpandedDebtId(expandedDebtId === id ? null : id);
    };

    const renderDebtItem = (debt, isOwedByMember) => {
        const otherPersonId = isOwedByMember ? debt.creditor : debt.debtor;
        const otherPerson = members?.find(m => m.uid === otherPersonId);
        const displayName = debt.toName || debt.fromName || (otherPerson ? getDisplayName(otherPerson) : 'Member');

        const isAuto = debt.type === 'auto';
        const contributingExpenses = isAuto && debt.expenseIds
            ? expenses.filter(e => debt.expenseIds.includes(e.id))
            : [];

        return (
            <div key={debt.id} className="border border-border rounded-lg overflow-hidden mb-3">
                <div
                    className="p-3 bg-card flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => toggleExpand(debt.id)}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isOwedByMember ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            <DollarSign size={16} />
                        </div>
                        <div>
                            <p className="font-medium text-sm">
                                {isOwedByMember ? 'Owes' : 'Owed by'} {displayName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant={isAuto ? 'secondary' : 'outline'} className="text-[10px] px-1 py-0 h-5">
                                    {isAuto ? 'Auto' : 'Manual'}
                                </Badge>
                                <span>{format(new Date(debt.date), 'MMM dd')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`font-bold ${isOwedByMember ? 'text-red-600' : 'text-green-600'}`}>
                            ৳{parseFloat(debt.remainingAmount).toFixed(2)}
                        </span>
                        {expandedDebtId === debt.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>

                {expandedDebtId === debt.id && (
                    <div className="p-3 bg-accent/30 border-t border-border text-sm">
                        {isAuto ? (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contributing Expenses</p>
                                {contributingExpenses.length > 0 ? (
                                    contributingExpenses.map(exp => (
                                        <div key={exp.id} className="flex justify-between items-center text-xs p-2 bg-background rounded border border-border/50">
                                            <div className="flex items-center gap-2">
                                                <Receipt size={12} className="text-muted-foreground" />
                                                <span>{exp.item || 'Expense'}</span>
                                            </div>
                                            <span className="font-medium">৳{parseFloat(exp.amount || 0).toFixed(2)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">No details available</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note</p>
                                <p className="text-sm">{debt.notes || debt.reason || 'No notes'}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-3 flex justify-end gap-2">
                            {/* Only show Pay button if current user is the debtor, or if current user is manager */}
                            {/* And only show Settle button if current user is creditor or manager */}
                            <Button size="sm" variant="outline" onClick={() => onSettle(debt)}>
                                Manage Debt
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Debt Details: ${getDisplayName(member)}`}
            size="lg"
        >
            <div className="space-y-6">
                {/* Summary Header */}
                <div className="flex items-center gap-4 p-4 bg-accent rounded-xl">
                    {member.photoURL ? (
                        <img src={member.photoURL} alt={member.name} className="w-16 h-16 rounded-full" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                            {getDisplayName(member).charAt(0)}
                        </div>
                    )}
                    <div>
                        <h3 className="text-xl font-bold">{getDisplayName(member)}</h3>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* To Pay Column */}
                    <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                            <ArrowRight className="rotate-45" size={18} />
                            To Pay ({debtsOwedByMember.length})
                        </h4>
                        <div className="space-y-2">
                            {debtsOwedByMember.length > 0 ? (
                                debtsOwedByMember.map(debt => renderDebtItem(debt, true))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No debts to pay.</p>
                            )}
                        </div>
                    </div>

                    {/* To Receive Column */}
                    <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                            <ArrowRight className="-rotate-45" size={18} />
                            To Receive ({debtsOwedToMember.length})
                        </h4>
                        <div className="space-y-2">
                            {debtsOwedToMember.length > 0 ? (
                                debtsOwedToMember.map(debt => renderDebtItem(debt, false))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No pending payments.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default DebtBreakdownModal;
