import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Dumbbell, Target, Clock, Settings } from 'lucide-react';
import { workoutSplitApi } from '../services/api';
import { WorkoutPlan, WorkoutSplit } from '../types';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import SearchableDropdown from './SearchableDropdown';

interface WorkoutPlanCardProps {
  onSplitChange?: (split: string) => void;
}

const WorkoutPlanCard = ({ onSplitChange }: WorkoutPlanCardProps) => {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSplit, setSelectedSplit] = useState<string>('');
  const [, setAvailableSplits] = useState<WorkoutSplit[]>([]);

  useEffect(() => {
    fetchWorkoutPlan();
    fetchAvailableSplits();
  }, []);

  useEffect(() => {
    if (selectedSplit) {
      fetchWorkoutPlan(selectedSplit);
      onSplitChange?.(selectedSplit);
    }
  }, [selectedSplit, onSplitChange]);

  const fetchWorkoutPlan = async (split?: string) => {
    try {
      setLoading(true);
      const plan = await workoutSplitApi.getWorkoutPlan(split);
      setWorkoutPlan(plan);
    } catch (error) {
      console.error('Error fetching workout plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSplits = async () => {
    try {
      const splits = await workoutSplitApi.getAllSplits();
      setAvailableSplits(splits);
    } catch (error) {
      console.error('Error fetching splits:', error);
    }
  };

  const getSplitColor = (splitName: string) => {
    switch (splitName.toLowerCase()) {
      case 'push': return 'from-red-500 to-red-600';
      case 'pull': return 'from-blue-500 to-blue-600';
      case 'legs': return 'from-green-500 to-green-600';
      case 'rest': return 'from-gray-500 to-gray-600';
      default: return 'from-primary-500 to-primary-600';
    }
  };

  const getSplitIcon = (splitName: string) => {
    switch (splitName.toLowerCase()) {
      case 'push': return '💪';
      case 'pull': return '🏋️';
      case 'legs': return '🦵';
      case 'rest': return '☕';
      default: return '🏃';
    }
  };

  if (loading) {
    return (
      <div className="card-elevated p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!workoutPlan) {
    return null;
  }

  return (
    <div className="card-elevated p-8">
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <div className="p-2 bg-primary-100 rounded-xl mr-3">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            Today's Workout Plan
          </h2>
        <div className="text-sm text-gray-500">
          {format(parseISO(workoutPlan.today), 'EEEE, MMMM d, yyyy', { locale: enUS })}
        </div>
      </div>

      {/* Split Selector */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <div className="p-2 bg-secondary-100 rounded-xl mr-3">
              <Settings className="h-5 w-5 text-secondary-600" />
            </div>
            Select Workout Type
          </h3>
        </div>
        <div className="max-w-md">
          <SearchableDropdown
            options={[
              { key: 'push', text: 'Push', value: 'Push' },
              { key: 'pull', text: 'Pull', value: 'Pull' },
              { key: 'legs', text: 'Legs', value: 'Legs' },
              { key: 'rest', text: 'Rest', value: 'Rest' }
            ]}
            placeholder="Select workout type..."
            value={selectedSplit}
            onChange={(_, data) => setSelectedSplit(data.value as string)}
            className="w-full"
          />
        </div>
        {selectedSplit && (
          <p className="text-sm text-gray-600 mt-2">
            You selected: <span className="font-semibold text-primary-600">{selectedSplit}</span>
          </p>
        )}
      </div>

      {workoutPlan.isRestDay ? (
        <div className="text-center py-12">
          <div className="relative mb-6">
            <div className="text-8xl mb-4">☕</div>
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-warning-400 rounded-full animate-pulse"></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Rest Day</h3>
          <p className="text-gray-600 mb-6">Let your body rest and recover</p>
          <div className="bg-gradient-to-r from-warning-50 to-warning-100 rounded-2xl p-6">
            <h4 className="font-semibold text-warning-800 mb-3">Recommended activities for rest day:</h4>
            <ul className="text-sm text-warning-700 space-y-2">
              <li>• Light walking or stretching</li>
              <li>• Get enough sleep (7-9 hours)</li>
              <li>• Stay hydrated</li>
              <li>• Eat nutritious food</li>
            </ul>
          </div>
          <div className="mt-6 p-4 bg-primary-50 rounded-xl">
            <p className="text-sm text-primary-700">
                  <strong>Next Workout:</strong> {format(parseISO(workoutPlan.nextWorkout), 'EEEE, MMMM d', { locale: enUS })}
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* Current Split */}
          <div className={`bg-gradient-to-r ${getSplitColor(workoutPlan.currentSplit.name)} rounded-2xl p-6 text-white mb-6`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-3xl mr-3">{getSplitIcon(workoutPlan.currentSplit.name)}</span>
                  <h3 className="text-2xl font-bold">{workoutPlan.currentSplit.name} Day</h3>
                </div>
                <p className="text-white/90">{workoutPlan.currentSplit.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{workoutPlan.recommendedExercises.length}</div>
                <div className="text-sm text-white/80">Recommended</div>
              </div>
            </div>
          </div>

          {/* Recommended Exercises */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className={`h-5 w-5 mr-2 ${workoutPlan.currentSplit.name === 'Push' ? 'text-red-600' : workoutPlan.currentSplit.name === 'Pull' ? 'text-blue-600' : workoutPlan.currentSplit.name === 'Legs' ? 'text-green-600' : 'text-primary-600'}`} />
              Recommended Exercises
            </h4>
            {workoutPlan.recommendedExercises.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Dumbbell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No recommended exercises for today</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {workoutPlan.recommendedExercises.slice(0, 8).map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-primary-50 hover:to-primary-100 transition-all duration-200 border border-gray-200 hover:border-primary-200"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                      <Dumbbell className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{exercise.name}</p>
                      {exercise.category && (
                        <p className="text-xs text-gray-500">{exercise.category}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={`/workout${selectedSplit ? `?split=${selectedSplit}` : ''}`}
              className={`flex-1 flex items-center justify-center text-lg py-4 rounded-2xl font-bold text-white transition-all duration-200 transform hover:scale-105 shadow-lg ${getSplitColor(workoutPlan.currentSplit.name).replace('from-', 'bg-gradient-to-r from-').replace('to-', 'to-')}`}
            >
              <Dumbbell className="h-5 w-5 mr-2" />
              Start Workout
            </Link>
            <Link
              to="/exercises"
              className="btn btn-secondary flex-1 flex items-center justify-center text-lg py-4"
            >
              <Target className="h-5 w-5 mr-2" />
              View All Exercises
            </Link>
          </div>

          {/* Next Workout */}
          <div className={`mt-6 p-4 bg-gradient-to-r ${getSplitColor(workoutPlan.currentSplit.name).replace('from-', 'from-').replace('to-', 'to-').replace('-500', '-50').replace('-600', '-100')} rounded-xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-primary-600 mr-2" />
                <p className="text-sm text-primary-700">
                  <strong>Next Workout:</strong> {format(parseISO(workoutPlan.nextWorkout), 'EEEE, MMMM d', { locale: enUS })}
                </p>
              </div>
              {workoutPlan.nextSplit && (
                <div className="text-right">
                  <p className="text-sm font-semibold text-secondary-700">
                    Suggested: {workoutPlan.nextSplit} Day
                  </p>
                  <p className="text-xs text-gray-600">
                    {workoutPlan.currentSplit.name === 'Push' && 'Push → Pull → Legs'}
                    {workoutPlan.currentSplit.name === 'Pull' && 'Pull → Legs → Push'}
                    {workoutPlan.currentSplit.name === 'Legs' && 'Legs → Push → Pull'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutPlanCard;
