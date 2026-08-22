import React, { useState, useMemo } from 'react';
import { format, addDays, startOfToday, isSameDay, parseISO } from 'date-fns';
import { Plus, Edit, Trash2, ChefHat, Calendar as CalendarIcon, Info } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Button from '../components/ui/Button';
import { useMealPlan } from '../context/MealPlanContext';
import { useHousehold } from '../context/HouseholdContext';
import MealFormModal from '../components/MealPlan/MealFormModal';

const MEAL_ORDER = {
  'Breakfast': 1,
  'Lunch': 2,
  'Snack': 3,
  'Dinner': 4
};

const MealPlan = () => {
  const { meals, deleteMeal, loading } = useMealPlan();
  const { members } = useHousehold();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingMeal, setEditingMeal] = useState(null);

  // Generate 7 days starting from today
  const days = useMemo(() => {
    const today = startOfToday();
    return Array.from({ length: 7 }).map((_, i) => addDays(today, i));
  }, []);

  const handleAddClick = (date) => {
    setSelectedDate(date);
    setEditingMeal(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (meal) => {
    setEditingMeal(meal);
    setSelectedDate(parseISO(meal.date));
    setIsModalOpen(true);
  };

  const handleDeleteClick = (mealId) => {
    if (window.confirm('Are you sure you want to remove this meal?')) {
      deleteMeal(mealId);
    }
  };

  const getCookName = (uid) => {
    if (!uid) return null;
    const member = members.find(m => m.uid === uid);
    return member ? (member.nickname || member.name) : 'Unknown Cook';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center p-8">
          <div className="animate-pulse text-primary font-medium">Loading Meal Plan...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto pb-20">
        <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="text-primary" />
              Weekly Meal Plan
            </h1>
            <p className="text-muted-foreground text-sm">Coordinate cooking and meals</p>
          </div>
          <Button onClick={() => handleAddClick(new Date())} icon={<Plus size={18} />}>
            Add Meal
          </Button>
        </div>

        <div className="grid gap-6">
          {days.map(day => {
            // Find meals for this day, sorted by meal type order
            const dayMeals = meals
              .filter(m => m.date === format(day, 'yyyy-MM-dd'))
              .sort((a, b) => (MEAL_ORDER[a.mealType] || 99) - (MEAL_ORDER[b.mealType] || 99));

            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={day.toISOString()} 
                className={`bg-card rounded-xl border overflow-hidden shadow-sm ${
                  isToday ? 'border-primary ring-1 ring-primary/20' : 'border-border'
                }`}
              >
                {/* Day Header */}
                <div className={`p-4 flex justify-between items-center border-b ${
                  isToday ? 'bg-primary/10 border-primary/20' : 'bg-muted/30 border-border'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${
                      isToday ? 'bg-primary text-primary-foreground shadow-md' : 'bg-background border'
                    }`}>
                      <span className="text-xs font-bold uppercase">{format(day, 'EEE')}</span>
                      <span className="text-lg font-black leading-none">{format(day, 'd')}</span>
                    </div>
                    <div>
                      <h2 className={`font-semibold ${isToday ? 'text-primary' : ''}`}>
                        {isToday ? 'Today' : format(day, 'EEEE')}
                      </h2>
                      <span className="text-xs text-muted-foreground">{format(day, 'MMMM yyyy')}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleAddClick(day)}>
                    <Plus size={16} className="mr-1" /> Add
                  </Button>
                </div>

                {/* Meals List */}
                <div className="p-4">
                  {dayMeals.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {dayMeals.map(meal => (
                        <div 
                          key={meal.id} 
                          className="group relative bg-background border border-border rounded-lg p-3 hover:shadow-md hover:border-primary/50 transition-all"
                        >
                          {/* Actions */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background/80 backdrop-blur-sm rounded-md p-1">
                            <button 
                              onClick={() => handleEditClick(meal)}
                              className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-accent transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(meal.id)}
                              className="p-1.5 text-muted-foreground hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="flex flex-col h-full">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                              {meal.mealType}
                            </span>
                            <h3 className="font-semibold text-foreground pr-12 line-clamp-2 leading-tight">
                              {meal.title}
                            </h3>
                            
                            <div className="mt-auto pt-3 space-y-2">
                              {meal.cookedBy && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-accent/50 w-fit px-2 py-1 rounded-full">
                                  <ChefHat size={12} className="text-orange-500" />
                                  <span>{getCookName(meal.cookedBy)}</span>
                                </div>
                              )}
                              
                              {meal.notes && (
                                <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded line-clamp-2 flex gap-1.5">
                                  <Info size={12} className="shrink-0 mt-0.5" />
                                  <span title={meal.notes}>{meal.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/60">
                      No meals planned for this day.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <MealFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          defaultDate={selectedDate}
          existingMeal={editingMeal}
        />
      )}
    </Layout>
  );
};

export default MealPlan;
