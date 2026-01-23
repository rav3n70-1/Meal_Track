import React from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight, CheckCircle } from 'lucide-react';
import { getDisplayName } from '../../utils/displayName';

const MemberDebtCard = ({ member, balanceData, onClick }) => {
    const { totalDebtOwed, totalDebtCredit, balance } = balanceData;

    // Determine status color
    let statusColor = 'text-gray-500';
    let bgColor = 'bg-gray-100 dark:bg-gray-800';
    let borderColor = 'border-gray-200 dark:border-gray-700';

    if (balance > 0.01) {
        statusColor = 'text-green-600 dark:text-green-400';
        bgColor = 'bg-green-50 dark:bg-green-900/20';
        borderColor = 'border-green-200 dark:border-green-900/50';
    } else if (balance < -0.01) {
        statusColor = 'text-red-600 dark:text-red-400';
        bgColor = 'bg-red-50 dark:bg-red-900/20';
        borderColor = 'border-red-200 dark:border-red-900/50';
    }

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`relative overflow-hidden rounded-xl border ${borderColor} ${bgColor} p-4 cursor-pointer transition-all shadow-sm hover:shadow-md`}
        >
            <div className="flex items-center gap-3 mb-3">
                {member.photoURL ? (
                    <img
                        src={member.photoURL}
                        alt={getDisplayName(member)}
                        className="w-12 h-12 rounded-full border-2 border-background object-cover"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {getDisplayName(member).charAt(0)}
                    </div>
                )}
                <div>
                    <h3 className="font-bold text-lg leading-tight">{getDisplayName(member)}</h3>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
            </div>

            <div className="space-y-2">
                {Math.abs(balance) < 0.01 ? (
                    <div className="flex items-center gap-2 text-gray-500 py-2">
                        <CheckCircle size={20} />
                        <span className="font-medium">All settled up</span>
                    </div>
                ) : (
                    <>
                        {totalDebtOwed > 0.01 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Owes others</span>
                                <span className="font-bold text-red-600 dark:text-red-400">
                                    ৳{totalDebtOwed.toFixed(2)}
                                </span>
                            </div>
                        )}
                        {totalDebtCredit > 0.01 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Owed to them</span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                    ৳{totalDebtCredit.toFixed(2)}
                                </span>
                            </div>
                        )}
                        <div className="pt-2 mt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-center">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Net Balance</span>
                            <span className={`font-bold text-lg ${statusColor}`}>
                                {balance > 0 ? '+' : ''}৳{balance.toFixed(2)}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Hover indicator */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={20} className="text-muted-foreground" />
            </div>
        </motion.div>
    );
};

export default MemberDebtCard;
