import React from 'react';
import Card from '../ui/Card';
import Select from '../ui/Select';
import DatePicker from '../ui/DatePicker';
import { Filter, X } from 'lucide-react';
import Button from '../ui/Button';

const PersonalExpenseFilter = ({
    filters,
    onFilterChange,
    onClearFilters,
    categories
}) => {
    return (
        <Card className="p-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Filter size={16} />
                    <span className="text-sm font-medium">Filters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Select
                        label="Category"
                        value={filters.category}
                        onChange={(e) => onFilterChange('category', e.target.value)}
                        options={[
                            { value: 'all', label: 'All Categories' },
                            ...categories
                        ]}
                    />

                    <DatePicker
                        label="Start Date"
                        value={filters.startDate}
                        onChange={(e) => onFilterChange('startDate', e.target.value)}
                    />

                    <DatePicker
                        label="End Date"
                        value={filters.endDate}
                        onChange={(e) => onFilterChange('endDate', e.target.value)}
                    />

                    <div className="flex items-end">
                        <Button
                            variant="outline"
                            onClick={onClearFilters}
                            className="w-full"
                            icon={<X size={16} />}
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default PersonalExpenseFilter;
