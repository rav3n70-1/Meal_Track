// Quick add templates for common expenses
export const QUICK_TEMPLATES = [
  {
    id: 'breakfast',
    name: 'Breakfast',
    emoji: '🍳',
    category: 'groceries',
    items: [
      { name: 'Bread', amount: 50, buyer: '' },
      { name: 'Eggs', amount: 100, buyer: '' },
      { name: 'Milk', amount: 60, buyer: '' }
    ]
  },
  {
    id: 'lunch',
    name: 'Lunch',
    emoji: '🍛',
    category: 'groceries',
    items: [
      { name: 'Rice', amount: 150, buyer: '' },
      { name: 'Vegetables', amount: 100, buyer: '' },
      { name: 'Meat/Fish', amount: 300, buyer: '' }
    ]
  },
  {
    id: 'dinner',
    name: 'Dinner',
    emoji: '🍽️',
    category: 'groceries',
    items: [
      { name: 'Rice', amount: 150, buyer: '' },
      { name: 'Curry', amount: 200, buyer: '' },
      { name: 'Vegetables', amount: 100, buyer: '' }
    ]
  },
  {
    id: 'snacks',
    name: 'Snacks',
    emoji: '🍿',
    category: 'groceries',
    items: [
      { name: 'Snacks', amount: 100, buyer: '' },
      { name: 'Drinks', amount: 80, buyer: '' }
    ]
  },
  {
    id: 'weekly_groceries',
    name: 'Weekly Groceries',
    emoji: '🛒',
    category: 'groceries',
    items: [
      { name: 'Rice', amount: 500, buyer: '' },
      { name: 'Vegetables', amount: 300, buyer: '' },
      { name: 'Fruits', amount: 200, buyer: '' },
      { name: 'Meat/Fish', amount: 600, buyer: '' },
      { name: 'Dairy', amount: 250, buyer: '' }
    ]
  },
  {
    id: 'internet_bill',
    name: 'Internet Bill',
    emoji: '📶',
    category: 'internet',
    items: [
      { name: 'Monthly Internet', amount: 1000, buyer: '' }
    ]
  },
  {
    id: 'electricity_bill',
    name: 'Electricity Bill',
    emoji: '⚡',
    category: 'utilities',
    items: [
      { name: 'Electricity', amount: 1500, buyer: '' }
    ]
  },
  {
    id: 'water_bill',
    name: 'Water Bill',
    emoji: '💧',
    category: 'water',
    items: [
      { name: 'Water', amount: 300, buyer: '' }
    ]
  },
  {
    id: 'gas_bill',
    name: 'Gas Bill',
    emoji: '🔥',
    category: 'utilities',
    items: [
      { name: 'Gas', amount: 500, buyer: '' }
    ]
  },
  {
    id: 'rent',
    name: 'Monthly Rent',
    emoji: '🏠',
    category: 'rent',
    items: [
      { name: 'House Rent', amount: 10000, buyer: '' }
    ]
  }
];

export const getTemplateById = (id) => {
  return QUICK_TEMPLATES.find(template => template.id === id);
};

