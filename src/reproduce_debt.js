
// Mock roundUpSharedAmount from calculations.js
const roundUpSharedAmount = (amount, numberOfPeople) => {
    if (!numberOfPeople || numberOfPeople === 0) {
        return {
            exact: 0,
            rounded: 0,
            calculation: `৳${amount.toFixed(2)} ÷ ${numberOfPeople} = ৳0.00 per person`
        };
    }

    const exact = amount / numberOfPeople;
    const rounded = Math.round(exact / 10) * 10; // Round to nearest 10
    const difference = rounded - exact;

    return {
        exact,
        rounded,
        difference,
        calculation: `...`
    };
};

// Mock roundDebtToNearestTen from calculations.js
const roundDebtToNearestTen = (amount) => {
    const rounded = Math.round(amount / 10) * 10;
    return {
        original: amount,
        rounded,
        calculation: `...`
    };
};

// NEW Granular calculateAutomaticDebts logic
const calculateAutomaticDebts = (expenses, members) => {
    console.log(`Calculating debts for ${expenses.length} expenses and ${members.length} members`);

    const approvedExpenses = expenses.filter(exp => {
        const status = typeof exp.status === 'string' ? exp.status.toLowerCase() : exp.status;
        if (status === 'rejected') return false;
        if (status === 'approved' || status === true) return true;
        return typeof status === 'undefined';
    });

    console.log(`Found ${approvedExpenses.length} approved/eligible expenses`);

    const automaticDebts = [];

    approvedExpenses.forEach(expense => {
        const sharedAmong = expense.sharedAmong || [];

        if (sharedAmong.length === 0) return;

        if (expense.items && Array.isArray(expense.items) && expense.items.length > 0) {
            expense.items.forEach((item, itemIndex) => {
                const itemAmount = parseFloat(item.amount) || 0;
                const buyer = item.buyer;

                if (itemAmount <= 0 || !buyer) return;

                const shareCalc = roundUpSharedAmount(itemAmount, sharedAmong.length);
                const sharePerPerson = shareCalc.rounded;

                sharedAmong.forEach(memberId => {
                    if (memberId === buyer) return;

                    automaticDebts.push({
                        id: `auto_${expense.id}_${itemIndex}_${memberId}_${buyer}`,
                        expenseId: expense.id,
                        expenseDate: expense.date,
                        expenseTitle: item.name || expense.title || 'Shared Expense',
                        debtor: memberId,
                        creditor: buyer,
                        amount: sharePerPerson,
                        originalAmount: sharePerPerson,
                        type: 'auto',
                        calculation: shareCalc.calculation,
                        status: 'approved',
                        date: expense.date,
                        createdAt: expense.createdAt || new Date().toISOString()
                    });
                });
            });
        } else {
            const amount = parseFloat(expense.amount) || 0;
            const buyer = expense.buyer;

            if (amount <= 0 || !buyer) return;

            const shareCalc = roundUpSharedAmount(amount, sharedAmong.length);
            const sharePerPerson = shareCalc.rounded;

            sharedAmong.forEach(memberId => {
                if (memberId === buyer) return;

                automaticDebts.push({
                    id: `auto_${expense.id}_${memberId}_${buyer}`,
                    expenseId: expense.id,
                    expenseDate: expense.date,
                    expenseTitle: expense.item || expense.title || 'Shared Expense',
                    debtor: memberId,
                    creditor: buyer,
                    amount: sharePerPerson,
                    originalAmount: sharePerPerson,
                    type: 'auto',
                    calculation: shareCalc.calculation,
                    status: 'approved',
                    date: expense.date,
                    createdAt: expense.createdAt || new Date().toISOString()
                });
            });
        }
    });

    console.log(`Generated ${automaticDebts.length} granular automatic debt records`);
    return automaticDebts;
};

// Test Scenario
const managerId = 'manager_123';
const memberBId = 'member_B';
const memberCId = 'member_C';

const members = [
    { uid: managerId, name: 'Manager' },
    { uid: memberBId, name: 'Member B' },
    { uid: memberCId, name: 'Member C' }
];

const expense = {
    id: 'exp_1',
    status: 'approved',
    date: '2023-10-27',
    sharedAmong: [memberBId, memberCId],
    items: [
        {
            name: 'Test Item',
            amount: 495,
            buyer: memberBId
        }
    ],
    createdBy: managerId
};

const expenses = [expense];

console.log('Running calculation...');
const debts = calculateAutomaticDebts(expenses, members);
console.log('Debts generated:', JSON.stringify(debts, null, 2));

if (debts.length > 0) {
    console.log('SUCCESS: Debts were generated.');
    // Check for granular IDs
    if (debts[0].id.startsWith('auto_exp_1')) {
        console.log('SUCCESS: Granular IDs generated.');
    } else {
        console.log('FAILURE: Granular IDs NOT generated. Got: ' + debts[0].id);
    }
} else {
    console.log('FAILURE: No debts generated.');
}
