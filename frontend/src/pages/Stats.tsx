import { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Target } from 'lucide-react';
import SearchableDropdown from '../components/SearchableDropdown';
import { statsApi, exerciseApi } from '../services/api';
import { PersonalRecord, ProgressData, Exercise } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, subWeeks, subMonths } from 'date-fns';
import { enUS } from 'date-fns/locale';

const Stats = () => {
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<number>(0);
  const [selectedMetric, setSelectedMetric] = useState<'max_weight' | 'total_volume'>('max_weight');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month'>('week');
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedExercise > 0) {
      fetchProgressData();
    }
  }, [selectedExercise, selectedMetric, selectedTimeframe]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [records, exerciseData] = await Promise.all([
        statsApi.getPersonalRecords(),
        exerciseApi.getAll()
      ]);
      
      setPersonalRecords(records.filter(record => record.max_weight > 0).slice(0, 5));
      setExercises(exerciseData);
      
      if (exerciseData.length > 0) {
        setSelectedExercise(exerciseData[0].id);
      }
    } catch (error) {
      console.error('Error fetching stats data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressData = async () => {
    try {
      setChartLoading(true);
      const data = await statsApi.getProgressData(selectedExercise, selectedMetric);
      
      // Filter data based on selected timeframe
      const filteredData = filterDataByTimeframe(data, selectedTimeframe);
      setProgressData(filteredData);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const filterDataByTimeframe = (data: ProgressData[], timeframe: 'week' | 'month'): ProgressData[] => {
    const now = new Date();
    const cutoffDate = timeframe === 'week' 
      ? subWeeks(now, 1) 
      : subMonths(now, 1);
    
    return data.filter(item => {
      const itemDate = parseISO(item.date);
      return itemDate >= cutoffDate;
    });
  };

  const formatChartDate = (dateString: string) => {
    return format(parseISO(dateString), 'M/d', { locale: enUS });
  };

  const getChartData = () => {
    return progressData.map(item => ({
      date: formatChartDate(item.date),
      value: item.max_weight,
      fullDate: item.date
    }));
  };

  const getBodyPartMaxWeights = () => {
    const bodyParts = {
      'Chest': { maxWeight: 0, exercise: '' },
      'Back': { maxWeight: 0, exercise: '' },
      'Shoulders': { maxWeight: 0, exercise: '' },
      'Arms': { maxWeight: 0, exercise: '' },
      'Legs': { maxWeight: 0, exercise: '' },
      'Core': { maxWeight: 0, exercise: '' }
    };

    personalRecords.forEach(record => {
      const category = record.exercise_name.includes('Chest') || record.exercise_name.includes('Bench') || record.exercise_name.includes('Press') ? 'Chest' :
                      record.exercise_name.includes('Back') || record.exercise_name.includes('Row') || record.exercise_name.includes('Pull') ? 'Back' :
                      record.exercise_name.includes('Shoulder') || record.exercise_name.includes('Lateral') ? 'Shoulders' :
                      record.exercise_name.includes('Bicep') || record.exercise_name.includes('Tricep') || record.exercise_name.includes('Curl') ? 'Arms' :
                      record.exercise_name.includes('Squat') || record.exercise_name.includes('Leg') || record.exercise_name.includes('Calf') ? 'Legs' :
                      record.exercise_name.includes('Core') || record.exercise_name.includes('Ab') ? 'Core' : 'Other';

      if (category !== 'Other' && bodyParts[category as keyof typeof bodyParts] && record.max_weight > bodyParts[category as keyof typeof bodyParts].maxWeight) {
        bodyParts[category as keyof typeof bodyParts].maxWeight = record.max_weight;
        bodyParts[category as keyof typeof bodyParts].exercise = record.exercise_name;
      }
    });

    return Object.entries(bodyParts)
      .filter(([_, data]) => data.maxWeight > 0)
      .map(([name, data]) => ({ name, maxWeight: data.maxWeight, exercise: data.exercise }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="h-6 w-6 mr-2 text-primary-600" />
          Statistics & Progress
        </h1>
      </div>

      {/* Body Part Max Weights */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-primary-600" />
          Max Weight by Body Part
        </h2>
        
        {personalRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No personal records yet</p>
            <p className="text-sm">Start working out to build your stats</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getBodyPartMaxWeights().map((bodyPart) => (
              <div key={bodyPart.name} className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
                <h3 className="font-semibold text-primary-800 mb-2">{bodyPart.name}</h3>
                <div className="text-2xl font-bold text-primary-600 mb-1">{bodyPart.maxWeight} kg</div>
                <div className="text-sm text-primary-700">{bodyPart.exercise}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personal Records */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-primary-600" />
          Last 5 Personal Records
        </h2>
        
        {personalRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No personal records yet</p>
            <p className="text-sm">Start working out to build your stats</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Exercise</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Max Weight (kg)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Max Reps</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {personalRecords.map((record) => (
                  <tr key={record.exercise_id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-900">{record.exercise_name}</td>
                    <td className="py-3 px-4 text-gray-600 font-semibold">{record.max_weight} kg</td>
                    <td className="py-3 px-4 text-gray-600">{record.max_reps} reps</td>
                    <td className="py-3 px-4 text-gray-600">
                      {format(parseISO(record.last_achieved), 'MMM d, yyyy', { locale: enUS })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Progress Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
            Progress Chart
          </h2>
          
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
              <SearchableDropdown
                options={[
                  { key: '0', text: 'Select Exercise', value: 0 },
                  ...exercises.map((exercise) => ({
                    key: exercise.id.toString(),
                    text: exercise.name,
                    value: exercise.id
                  }))
                ]}
                placeholder="Select exercise..."
                value={selectedExercise}
                onChange={(_, data) => setSelectedExercise(data.value as number)}
                className="w-48"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
              <SearchableDropdown
                options={[
                  { key: 'max_weight', text: 'Max Weight', value: 'max_weight' }
                ]}
                placeholder="Select metric..."
                value={selectedMetric}
                onChange={(_, data) => setSelectedMetric(data.value as 'max_weight')}
                className="w-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
              <SearchableDropdown
                options={[
                  { key: 'week', text: 'Last Week', value: 'week' },
                  { key: 'month', text: 'Last Month', value: 'month' }
                ]}
                placeholder="Select timeframe..."
                value={selectedTimeframe}
                onChange={(_, data) => setSelectedTimeframe(data.value as 'week' | 'month')}
                className="w-32"
              />
            </div>
          </div>
        </div>

        {chartLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : progressData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No data available for this exercise</p>
            <p className="text-sm">Start logging workouts to see the chart</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: selectedMetric === 'max_weight' ? 'น้ำหนัก (kg)' : 'Volume (kg)', 
                    angle: -90, 
                    position: 'insideLeft' 
                  }}
                />
                <Tooltip 
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0] && payload[0].payload) {
                      return format(parseISO(payload[0].payload.fullDate), 'MMM d, yyyy', { locale: enUS });
                    }
                    return label;
                  }}
                  formatter={(value: number) => [
                    `${value} kg`,
                    'Max Weight'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default Stats;
