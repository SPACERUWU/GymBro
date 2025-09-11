import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { workoutPlanningApi, workoutSplitApi } from '../services/api';
import { PlannedWorkout, WorkoutSplit, CreatePlannedWorkoutRequest } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmDialog from './ConfirmDialog';

interface WorkoutCalendarProps {
  onDateSelect?: (date: string) => void;
  refreshTrigger?: number;
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({ onDateSelect, refreshTrigger }) => {
  const { showSuccess, showError } = useNotification();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkout[]>([]);
  const [workoutSplits, setWorkoutSplits] = useState<WorkoutSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [, setSelectedDate] = useState<string>('');
  const [selectedWorkout, setSelectedWorkout] = useState<PlannedWorkout | null>(null);
  const [formData, setFormData] = useState<CreatePlannedWorkoutRequest>({
    date: '',
    split_id: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  useEffect(() => {
    if (refreshTrigger) {
      fetchData();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    const handleWorkoutSaved = () => {
      fetchData();
    };

    window.addEventListener('workoutSaved', handleWorkoutSaved);
    return () => window.removeEventListener('workoutSaved', handleWorkoutSaved);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      
      const [workouts, splits] = await Promise.all([
        workoutPlanningApi.getPlannedWorkouts(startDate, endDate),
        workoutSplitApi.getAllSplits()
      ]);
      
      setPlannedWorkouts(workouts);
      setWorkoutSplits(splits);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      showError('Error', 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Get the start of the week for the first day of the month
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday = 0
  // Get the end of the week for the last day of the month
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 }); // Sunday = 0
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getPlannedWorkoutForDate = (date: Date): PlannedWorkout | undefined => {
    return plannedWorkouts.find(workout => 
      isSameDay(parseISO(workout.date), date)
    );
  };

  const handleDateClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const plannedWorkout = getPlannedWorkoutForDate(date);
    
    if (plannedWorkout) {
      setSelectedWorkout(plannedWorkout);
      setShowDeleteModal(true);
    } else {
      setSelectedDate(dateString);
      setFormData({
        date: dateString,
        split_id: 0,
        notes: ''
      });
      setShowAddModal(true);
    }
    
    if (onDateSelect) {
      onDateSelect(dateString);
    }
  };

  const handleAddWorkout = async () => {
    try {
      if (!formData.split_id) {
        showError('Validation Error', 'Please select a workout split');
        return;
      }

      await workoutPlanningApi.createPlannedWorkout(formData);
      showSuccess('Workout Planned', `Workout planned for ${format(parseISO(formData.date), 'MMM d, yyyy')}`);
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating planned workout:', error);
      showError('Error', 'Failed to plan workout');
    }
  };

  const [deleting, setDeleting] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleDeleteWorkout = async () => {
    if (!selectedWorkout || deleting) return;

    try {
      setDeleting(true);
      await workoutPlanningApi.deletePlannedWorkout(selectedWorkout.id);
      showSuccess('Workout Removed', 'Planned workout has been removed');
      setShowDeleteModal(false);
      setSelectedWorkout(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting planned workout:', error);
      showError('Error', 'Failed to remove planned workout');
    } finally {
      setDeleting(false);
    }
  };

  // const handleMarkCompleted = async (workout: PlannedWorkout) => {
  //   try {
  //     await workoutPlanningApi.markWorkoutCompleted(workout.id);
  //     showSuccess('Workout Completed', 'Great job completing your workout!');
  //     fetchData();
  //   } catch (error) {
  //     console.error('Error marking workout as completed:', error);
  //     showError('Error', 'Failed to mark workout as completed');
  //   }
  // };

  const handleClearAllWorkouts = async () => {
    if (clearing) return;

    try {
      setClearing(true);
      
      // Delete all planned workouts for the current month
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const monthWorkouts = plannedWorkouts.filter(workout => {
        const workoutDate = parseISO(workout.date);
        return workoutDate >= monthStart && workoutDate <= monthEnd;
      });

      // Delete each workout
      for (const workout of monthWorkouts) {
        await workoutPlanningApi.deletePlannedWorkout(workout.id);
      }

      showSuccess('Calendar Cleared', `Removed ${monthWorkouts.length} planned workouts for ${format(currentDate, 'MMMM yyyy')}`);
      setShowClearModal(false);
      fetchData();
    } catch (error) {
      console.error('Error clearing workouts:', error);
      showError('Error', 'Failed to clear planned workouts');
    } finally {
      setClearing(false);
    }
  };

  const getSplitColor = (splitName: string): string => {
    switch (splitName.toLowerCase()) {
      case 'push': return 'bg-red-100 text-red-800 border-red-200';
      case 'pull': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'legs': return 'bg-green-100 text-green-800 border-green-200';
      case 'rest': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <CalendarIcon className="h-6 w-6 mr-3 text-primary-600" />
          Workout Calendar
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowClearModal(true)}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
          >
            Clear Month
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 min-w-[140px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const plannedWorkout = getPlannedWorkoutForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-[80px] p-2 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200
                ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                ${isToday ? 'ring-2 ring-primary-500' : ''}
                ${plannedWorkout ? 'hover:shadow-md' : ''}
              `}
              onClick={() => handleDateClick(day)}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              
              {plannedWorkout && (
                <div className="space-y-1">
                  <div className={`
                    text-xs px-2 py-1 rounded-full border text-center truncate
                    ${getSplitColor(plannedWorkout.split_name)}
                    ${plannedWorkout.is_completed ? 'opacity-60' : ''}
                  `}>
                    {plannedWorkout.split_name}
                  </div>
                  
                  {plannedWorkout.is_completed && (
                    <div className="flex justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-100 border border-red-200 rounded mr-2"></div>
          <span>Push</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded mr-2"></div>
          <span>Pull</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-2"></div>
          <span>Legs</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded mr-2"></div>
          <span>Rest</span>
        </div>
      </div>

      {/* Add Workout Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-strong">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Plan Workout</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workout Split
                </label>
                <select
                  value={formData.split_id}
                  onChange={(e) => setFormData({ ...formData, split_id: parseInt(e.target.value) })}
                  className="input w-full"
                  required
                >
                  <option value={0}>Select Split</option>
                  {workoutSplits.map(split => (
                    <option key={split.id} value={split.id}>
                      {split.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input w-full h-20 resize-none"
                  placeholder="Add notes about this workout..."
                />
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWorkout}
                className="btn btn-primary flex-1"
              >
                Plan Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        title="Remove Planned Workout"
        message={`Are you sure you want to remove the planned ${selectedWorkout?.split_name} workout for ${selectedWorkout ? format(parseISO(selectedWorkout.date), 'MMM d, yyyy') : ''}?`}
        confirmText={deleting ? "Removing..." : "Remove"}
        cancelText="Cancel"
        onConfirm={handleDeleteWorkout}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedWorkout(null);
        }}
        type="danger"
        disabled={deleting}
      />

      {/* Clear Month Confirmation Modal */}
      <ConfirmDialog
        isOpen={showClearModal}
        title="Clear Month"
        message={`Are you sure you want to remove all planned workouts for ${format(currentDate, 'MMMM yyyy')}? This action cannot be undone.`}
        confirmText={clearing ? "Clearing..." : "Clear Month"}
        cancelText="Cancel"
        onConfirm={handleClearAllWorkouts}
        onCancel={() => setShowClearModal(false)}
        type="danger"
        disabled={clearing}
      />
    </div>
  );
};

export default WorkoutCalendar;
