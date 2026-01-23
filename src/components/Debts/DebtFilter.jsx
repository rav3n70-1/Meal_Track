import React from 'react';
import Card, { CardContent } from '../ui/Card';
import { Search, Filter, X } from 'lucide-react';

const DebtFilter = ({
    filter,
    setFilter,
    members,
    onClear
}) => {
    return (
        <Card className="mb-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search debts..."
                            value={filter.search}
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Debtor Filter */}
                    <div className="w-full md:w-48">
                        <select
                            value={filter.debtor}
                            onChange={(e) => setFilter({ ...filter, debtor: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                            <option value="all">All Debtors</option>
                            {members.map(member => (
                                <option key={member.uid} value={member.uid}>
                                    {member.displayName || member.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Creditor Filter */}
                    <div className="w-full md:w-48">
                        <select
                            value={filter.creditor}
                            onChange={(e) => setFilter({ ...filter, creditor: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                            <option value="all">All Creditors</option>
                            {members.map(member => (
                                <option key={member.uid} value={member.uid}>
                                    {member.displayName || member.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Clear Filters */}
                    {(filter.search || filter.debtor !== 'all' || filter.creditor !== 'all') && (
                        <button
                            onClick={onClear}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Clear filters"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default DebtFilter;
