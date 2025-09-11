import { useState, useEffect } from 'react';
import { Calendar, Settings, Zap, RotateCcw } from 'lucide-react';
import WorkoutCalendar from '../components/WorkoutCalendar';
import { workoutPlanningApi, workoutSplitApi } from '../services/api';
import { WorkoutSchedule, WorkoutSplit } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { format } from 'date-fns';

const WorkoutPlanning = () => {
  const { showSuccess, showError } = useNotification();
  const [schedule, setSchedule] = useState<WorkoutSchedule | null>(null);
  const [, setWorkoutSplits] = useState<WorkoutSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scheduleData, splits] = await Promise.all([
        workoutPlanningApi.getWorkoutSchedule(),
        workoutSplitApi.getAllSplits()
      ]);
      
      setSchedule(scheduleData);
      setWorkoutSplits(splits);
    } catch (error) {
      console.error('Error fetching planning data:', error);
      showError('Error', 'Failed to load planning data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAutoSchedule = async () => {
    try {
      setGenerating(true);
      const startDate = format(new Date(), 'yyyy-MM-dd');
      const plannedWorkouts = await workoutPlanningApi.generateAutoSchedule(startDate, 4);
      
      showSuccess(
        'Auto Schedule Generated!', 
        `Generated ${plannedWorkouts.length} planned workouts for the next 4 weeks`
      );
    } catch (error) {
      console.error('Error generating auto schedule:', error);
      showError('Error', 'Failed to generate auto schedule');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateSchedule = async (updatedSchedule: Partial<WorkoutSchedule>) => {
    if (!schedule) return;

    try {
      const newSchedule = await workoutPlanningApi.updateWorkoutSchedule(updatedSchedule);
      setSchedule(newSchedule);
      showSuccess('Settings Updated', 'Your workout schedule preferences have been saved');
      setShowSettings(false);
    } catch (error) {
      console.error('Error updating schedule:', error);
      showError('Error', 'Failed to update schedule settings');
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="card-elevated p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
              <div className="p-3 bg-primary-100 rounded-2xl mr-4">
                <Calendar className="h-8 w-8 text-primary-600" />
              </div>
              Workout Planning
            </h1>
            <p className="text-gray-600 ml-16">Plan your workouts and track your fitness schedule</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowSettings(true)}
              className="btn btn-secondary flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
            <button
              onClick={handleGenerateAutoSchedule}
              disabled={generating}
              className="btn btn-primary flex items-center"
            >
              <Zap className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Auto Schedule'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-elevated p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-2xl mr-4">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Preferred Days</p>
              <p className="text-2xl font-bold text-gray-900">
                {schedule?.preferred_days.length || 0} days/week
              </p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-2xl mr-4">
              <RotateCcw className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Deload Frequency</p>
              <p className="text-2xl font-bold text-gray-900">
                Every {schedule?.deload_frequency || 4} weeks
              </p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-2xl mr-4">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Auto Schedule</p>
              <p className="text-2xl font-bold text-gray-900">Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <WorkoutCalendar />

      {/* Settings Modal */}
      {showSettings && schedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-strong">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Schedule Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Preferred Workout Days
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {dayNames.map((day, index) => (
                    <label key={index} className="flex flex-col items-center">
                      <input
                        type="checkbox"
                        checked={schedule.preferred_days.includes(index)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...schedule.preferred_days, index]
                            : schedule.preferred_days.filter(d => d !== index);
                          setSchedule({ ...schedule, preferred_days: newDays });
                        }}
                        className="sr-only"
                      />
                      <div className={`
                        w-12 h-12 rounded-lg border-2 flex items-center justify-center text-sm font-medium cursor-pointer transition-all
                        ${schedule.preferred_days.includes(index)
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-primary-300'
                        }
                      `}>
                        {day.slice(0, 3)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rest Days
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {dayNames.map((day, index) => (
                    <label key={index} className="flex flex-col items-center">
                      <input
                        type="checkbox"
                        checked={schedule.rest_days.includes(index)}
                        onChange={(e) => {
                          const newRestDays = e.target.checked
                            ? [...schedule.rest_days, index]
                            : schedule.rest_days.filter(d => d !== index);
                          setSchedule({ ...schedule, rest_days: newRestDays });
                        }}
                        className="sr-only"
                      />
                      <div className={`
                        w-12 h-12 rounded-lg border-2 flex items-center justify-center text-sm font-medium cursor-pointer transition-all
                        ${schedule.rest_days.includes(index)
                          ? 'bg-gray-500 text-white border-gray-500'
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-300'
                        }
                      `}>
                        {day.slice(0, 3)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deload Frequency (weeks)
                </label>
                <select
                  value={schedule.deload_frequency}
                  onChange={(e) => setSchedule({ ...schedule, deload_frequency: parseInt(e.target.value) })}
                  className="input w-full"
                >
                  <option value={2}>Every 2 weeks</option>
                  <option value={3}>Every 3 weeks</option>
                  <option value={4}>Every 4 weeks</option>
                  <option value={6}>Every 6 weeks</option>
                  <option value={8}>Every 8 weeks</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setShowSettings(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateSchedule(schedule)}
                className="btn btn-primary flex-1"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutPlanning;
