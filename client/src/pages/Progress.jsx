import { useState, useEffect, useMemo } from 'react';
import { useWorkouts } from '../context/WorkoutContext.jsx';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS modules to work seamlessly in Vite React bundle
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Progress = () => {
  const { workouts, loading, fetchWorkouts, report, reportLoading, fetchReport } = useWorkouts();
  const [activeTab, setActiveTab] = useState('charts');

  // Fetch initial workout data and report
  useEffect(() => {
    fetchWorkouts();
    fetchReport();
  }, [fetchWorkouts, fetchReport]);

  // ─── Stats aggregation ───
  const totalSessions = useMemo(() => {
    return workouts ? workouts.reduce((sum, w) => sum + (w.completedDates ? w.completedDates.length : 0), 0) : 0;
  }, [workouts]);

  const totalReps = useMemo(() => {
    return (workouts || []).reduce((sum, w) => sum + (w.totalReps || 0) * (w.completedDates ? w.completedDates.length : 0), 0);
  }, [workouts]);

  const totalCalories = useMemo(() => {
    return (workouts || []).reduce((sum, w) => sum + (w.calories || 0) * (w.completedDates ? w.completedDates.length : 0), 0);
  }, [workouts]);

  const totalDuration = useMemo(() => {
    return (workouts || []).reduce((sum, w) => sum + (w.duration || 0) * (w.completedDates ? w.completedDates.length : 0), 0);
  }, [workouts]);

  const avgAccuracy = useMemo(() => {
    const totalAccPoints = (workouts || []).reduce((sum, w) => sum + (w.accuracy || 0) * (w.completedDates ? w.completedDates.length : 0), 0);
    return totalSessions > 0 ? Math.round(totalAccPoints / totalSessions) : 100;
  }, [workouts, totalSessions]);

  // ─── 1. Weekly Workouts (Last 7 Days sliding window) ───
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
  }, []);

  const weeklyData = useMemo(() => {
    return last7Days.map((day) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      let count = 0;
      (workouts || []).forEach((w) => {
        if (w.completedDates) {
          w.completedDates.forEach((dateStr) => {
            const d = new Date(dateStr);
            if (d >= dayStart && d <= dayEnd) {
              count++;
            }
          });
        }
      });
      return count;
    });
  }, [last7Days, workouts]);

  const weeklyLabels = useMemo(() => {
    return last7Days.map((day) =>
      day.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })
    );
  }, [last7Days]);

  // ─── 2. Monthly Workouts (Last 4 Weeks sliding window) ───
  const weeklyTotals = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const start = new Date();
      start.setDate(start.getDate() - ((3 - i) * 7 + 6));
      start.setHours(0, 0, 0, 0);
      
      const end = new Date();
      end.setDate(end.getDate() - (3 - i) * 7);
      end.setHours(23, 59, 59, 999);

      let count = 0;
      (workouts || []).forEach((w) => {
        if (w.completedDates) {
          w.completedDates.forEach((dateStr) => {
            const d = new Date(dateStr);
            if (d >= start && d <= end) {
              count++;
            }
          });
        }
      });
      return count;
    });
  }, [workouts]);

  const monthlyLabels = useMemo(() => ['3 Wks Ago', '2 Wks Ago', '1 Wk Ago', 'Current Wk'], []);

  // ─── 3. Exercise Accuracy & Calories by type ───
  const exerciseGroups = useMemo(() => {
    return (workouts || []).reduce((groups, w) => {
      const name = w.exerciseName;
      const completionsCount = w.completedDates ? w.completedDates.length : 0;
      if (completionsCount > 0) {
        if (!groups[name]) {
          groups[name] = { totalAcc: 0, count: 0, totalCal: 0 };
        }
        groups[name].totalAcc += (w.accuracy || 0) * completionsCount;
        groups[name].count += completionsCount;
        groups[name].totalCal += (w.calories || 0) * completionsCount;
      }
      return groups;
    }, {});
  }, [workouts]);

  const exerciseNames = useMemo(() => Object.keys(exerciseGroups), [exerciseGroups]);
  const avgAccuracies = useMemo(() => {
    return exerciseNames.map(
      (name) => Math.round(exerciseGroups[name].totalAcc / exerciseGroups[name].count)
    );
  }, [exerciseNames, exerciseGroups]);
  
  const calorieValues = useMemo(() => {
    return exerciseNames.map((name) => exerciseGroups[name].totalCal);
  }, [exerciseNames, exerciseGroups]);

  // ─── Chart Colors and Configs ───
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#E2E8F0', font: { size: 11, weight: 'bold' } },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#CBD5E1', font: { size: 10, weight: '600' } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#CBD5E1', font: { size: 10, weight: '600' }, stepSize: 1 },
      },
    },
  }), []);

  // Weekly Workouts Chart
  const weeklyChartData = useMemo(() => ({
    labels: weeklyLabels,
    datasets: [
      {
        label: 'Sessions Completed',
        data: weeklyData,
        backgroundColor: '#6C63FF',
        borderRadius: 8,
        hoverBackgroundColor: '#8F85FF',
      },
    ],
  }), [weeklyLabels, weeklyData]);

  // Monthly Workouts Chart
  const monthlyChartData = useMemo(() => ({
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Sessions Completed',
        data: weeklyTotals,
        borderColor: '#00D9FF',
        backgroundColor: 'rgba(0, 217, 255, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#00D9FF',
      },
    ],
  }), [monthlyLabels, weeklyTotals]);

  // Exercise Accuracy Chart
  const accuracyChartData = useMemo(() => ({
    labels: exerciseNames,
    datasets: [
      {
        label: 'Average Accuracy (%)',
        data: avgAccuracies,
        backgroundColor: '#10B981',
        borderRadius: 8,
        hoverBackgroundColor: '#34D399',
      },
    ],
  }), [exerciseNames, avgAccuracies]);

  const accuracyChartOptions = useMemo(() => ({
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 0,
        max: 100,
        ticks: { color: '#CBD5E1', stepSize: 20 },
      },
    },
  }), [chartOptions]);

  // Calorie Burn Distribution Chart
  const calorieChartData = useMemo(() => ({
    labels: exerciseNames,
    datasets: [
      {
        data: calorieValues,
        backgroundColor: ['#6C63FF', '#00D9FF', '#10B981', '#F59E0B', '#EF4444', '#EC4899'],
        borderWidth: 1,
        borderColor: '#14142B',
      },
    ],
  }), [exerciseNames, calorieValues]);

  // ─── Early conditional returns placed safely after all hooks are declared ───

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Performance Analytics</h1>
          <p className="mt-2 text-sm text-[#A5B4FC] font-semibold tracking-wide uppercase">Analyze your workout performance over time.</p>
        </div>
        {/* Skeleton Stats Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl border border-white/5 skeleton-shimmer"></div>
          ))}
        </div>
        {/* Skeleton Chart Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2].map((n) => (
            <div key={n} className="h-[320px] rounded-2xl border border-white/5 skeleton-shimmer"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!workouts || workouts.length === 0 || totalSessions === 0) {
    return (
      <div className="space-y-6 animate-fadeIn pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Performance Analytics</h1>
          <p className="mt-2 text-sm text-[#A5B4FC] font-semibold tracking-wide uppercase">Analyze your workout performance over time.</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-12 text-center shadow-xl flex flex-col items-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20 mb-6 shadow-inner animate-pulse">
            <svg className="h-10 w-10 text-[#6C63FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Completed Workout Sessions Yet</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed font-medium">
            You need to complete and check off some workout sessions in your weekly planner to build your performance dashboard.
          </p>
          <Link
            to="/workouts"
            className="rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D9FF] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#6C63FF]/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none"
          >
            Go to Workout Planner
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Performance Analytics</h1>
          <p className="mt-2 text-sm text-[#A5B4FC] font-semibold tracking-wide uppercase">Analyze your workout metrics, accuracy levels, and training volume.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-xl border border-white/5 bg-[#14142B]/60 p-1 backdrop-blur-md self-start sm:self-center">
          <button
            onClick={() => setActiveTab('charts')}
            className={`rounded-lg px-4.5 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'charts'
                ? 'bg-[#6C63FF] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Charts & Metrics
          </button>
          <button
            onClick={() => {
              setActiveTab('report');
              fetchReport();
            }}
            className={`rounded-lg px-4.5 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'report'
                ? 'bg-[#6C63FF] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📋 AI Performance Report
          </button>
        </div>
      </div>

      {activeTab === 'charts' ? (
        <>
          {/* Metrics Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-5 shadow-lg">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Reps</p>
              <p className="text-2xl font-black font-mono text-white mt-2">{totalReps}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-5 shadow-lg">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Calories Burned</p>
              <p className="text-2xl font-black font-mono text-[#00D9FF] mt-2">{totalCalories} kcal</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-5 shadow-lg">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Active Duration</p>
              <p className="text-2xl font-black font-mono text-[#6C63FF] mt-2">{totalDuration} mins</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-5 shadow-lg">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Avg Accuracy</p>
              <p className="text-2xl font-black font-mono text-[#10B981] mt-2">{avgAccuracy}%</p>
            </div>
          </div>

          {/* Main Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Workouts Card */}
            <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-5 flex flex-col h-[320px] shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Weekly Workouts (Last 7 Days)</h3>
              <div className="flex-1 min-h-0 relative">
                <Bar data={weeklyChartData} options={chartOptions} />
              </div>
            </div>

            {/* Monthly Workouts Card */}
            <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-5 flex flex-col h-[320px] shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Monthly Trends (Sessions per Week)</h3>
              <div className="flex-1 min-h-0 relative">
                <Line data={monthlyChartData} options={chartOptions} />
              </div>
            </div>

            {/* Exercise Accuracy Card */}
            <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-5 flex flex-col h-[320px] shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Exercise Accuracy Comparison</h3>
              <div className="flex-1 min-h-0 relative">
                <Bar data={accuracyChartData} options={accuracyChartOptions} />
              </div>
            </div>

            {/* Calorie Burn Card */}
            <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-5 flex flex-col h-[320px] shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Calorie Burn Distribution (kcal)</h3>
              <div className="flex-1 min-h-0 relative flex items-center justify-center">
                <div className="h-full w-full p-2">
                  <Doughnut
                    data={calorieChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: { color: '#E2E8F0', font: { size: 10, weight: 'bold' } },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Performance Report Tab View */
        <div className="space-y-6">
          {reportLoading || !report ? (
            <div className="flex h-[40vh] flex-col items-center justify-center gap-4 border border-dashed border-white/5 rounded-2xl bg-[#14142B]/20">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-[#6C63FF]"></div>
              <p className="text-sm text-slate-300 font-semibold">Analyzing workout history and compiling suggestions...</p>
            </div>
          ) : (
            <div className="animate-fadeIn space-y-6">
              {/* Detailed Performance Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Overview Card */}
                <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-lg space-y-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Training Volume</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Total Workouts</p>
                      <p className="text-2xl font-black font-mono text-white mt-1.5">{report.totalWorkouts}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Total Repetitions</p>
                      <p className="text-2xl font-black font-mono text-white mt-1.5">{report.totalReps}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Calories Burned</p>
                      <p className="text-2xl font-black font-mono text-[#00D9FF] mt-1.5">{report.caloriesBurned} kcal</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Workout Time</p>
                      <p className="text-2xl font-black font-mono text-[#6C63FF] mt-1.5">{report.workoutTime} mins</p>
                    </div>
                  </div>
                </div>

                {/* Accuracy Metrics Card */}
                <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-lg flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2 mb-5">Alignment Accuracy</h3>
                    <div className="flex items-center gap-6">
                      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6.5" />
                          <circle
                            cx="40" cy="40" r="34" fill="none" stroke="#10B981" strokeWidth="6.5"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 34}`}
                            strokeDashoffset={`${2 * Math.PI * 34 * (1 - report.averageAccuracy / 100)}`}
                            className="transition-all duration-700"
                          />
                        </svg>
                        <span className="absolute text-base font-black font-mono text-[#10B981]">{report.averageAccuracy}%</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-200">Average Accuracy</p>
                        <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                          Reflects how precisely you aligned body joints inside posture correction boundaries.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Best & Weakest Exercises */}
                <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-lg flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Exercise Standing</h3>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400" aria-hidden="true">🏆</span>
                        <p className="text-[11px] font-bold text-slate-400 uppercase">Highest Accuracy</p>
                      </div>
                      <p className="text-base font-bold text-green-400 mt-1">{report.bestExercise}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400" aria-hidden="true">⚠️</span>
                        <p className="text-[11px] font-bold text-slate-400 uppercase">Lowest Accuracy</p>
                      </div>
                      <p className="text-base font-bold text-red-400 mt-1">{report.weakestExercise}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* AI Improvement Suggestions */}
              <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2.5">
                    <span aria-hidden="true">💡</span> Personalized Suggestions
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!report) return;
                        const reportText = `AI GYM TRAINER — POSTURE & PERFORMANCE REPORT
Date: ${new Date().toLocaleDateString()}
---------------------------------------------
Total Workouts: ${report.totalWorkouts}
Total Reps: ${report.totalReps}
Calories Burned: ${report.caloriesBurned} kcal
Workout Time: ${report.workoutTime} mins
Average Posture Accuracy: ${report.averageAccuracy}%
Highest Accuracy Exercise: ${report.bestExercise}
Lowest Accuracy Exercise: ${report.weakestExercise}

PERSONALIZED IMPROVEMENT SUGGESTIONS:
${report.improvementSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}
`;
                        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `AIGym_Posture_Report_${new Date().toISOString().slice(0,10)}.txt`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="rounded-xl bg-[#00D9FF]/15 px-4.5 py-2.5 text-xs font-bold text-[#00D9FF] hover:bg-[#00D9FF]/25 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus:outline-none flex items-center gap-1.5"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Export Report
                    </button>
                    <button
                      onClick={fetchReport}
                      className="rounded-xl bg-[#6C63FF]/15 px-4.5 py-2.5 text-xs font-bold text-[#8F85FF] hover:bg-[#6C63FF]/25 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {report.improvementSuggestions.map((suggestion, index) => {
                    // Choose icons based on keyword matching
                    let icon = '🎯';
                    let bgColor = 'bg-[#6C63FF]/10 text-[#8F85FF] border-[#6C63FF]/20';
                    if (suggestion.includes('under 80%') || suggestion.includes('accuracy for')) {
                      icon = '⚠️';
                      bgColor = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
                    } else if (suggestion.includes('Great job') || suggestion.includes('exceptional')) {
                      icon = '🏆';
                      bgColor = 'bg-green-500/10 text-green-300 border-green-500/20';
                    } else if (suggestion.includes('workouts a week') || suggestion.includes('stamina')) {
                      icon = '📅';
                      bgColor = 'bg-[#00D9FF]/10 text-[#00D9FF] border-[#00D9FF]/20';
                    }

                    return (
                      <div
                        key={index}
                        className={`flex items-start gap-3.5 border rounded-xl p-4 transition-all duration-300 ${bgColor}`}
                      >
                        <span className="text-xl leading-none mt-0.5" aria-hidden="true">{icon}</span>
                        <p className="text-xs leading-relaxed font-semibold">{suggestion}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Progress;
