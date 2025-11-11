"use client";

import {
  Chart as ChartJs,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { useState, useEffect } from 'react';

ChartJs.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const DashboardGraph = ({ reminders, onSleepDataUpdate }) => {
  const [sleepData, setSleepData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reminders) {
      fetchSleepPrediction(reminders);
    }
  }, [reminders]);

  const fetchSleepPrediction = async (userReminders) => {
    try {
      const response = await fetch('/api/reminder-sleep-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reminders: userReminders }),
      });

      const result = await response.json();
      
      if (result.ok) {
        setSleepData(result.data);
        if (onSleepDataUpdate) {
          onSleepDataUpdate(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sleep prediction:', error);
      const fallbackData = analyzeRemindersFallback(userReminders);
      setSleepData(fallbackData);
      if (onSleepDataUpdate) {
        onSleepDataUpdate(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  };

  const analyzeRemindersFallback = (userReminders) => {
    if (!userReminders || userReminders.length === 0) {
      return {
        predictedSleepDuration: 7.5,
        predictedWakeupConsistency: 1.5,
        analysis: {
          totalReminders: 0,
          eveningReminders: 0,
          highPriorityCount: 0,
          workRelatedCount: 0,
          hasSleepMentions: false,
          hasStressMentions: false,
          latestReminderHour: 0
        },
        confidence: 0.5
      };
    }

    let eveningReminders = 0;
    let highPriorityCount = 0;
    let workRelatedCount = 0;
    let hasStressMentions = false;
    let latestHour = 0;

    const stressKeywords = ['urgent', 'important', 'deadline', 'meeting', 'due', 'asap', 'emergency'];

    userReminders.forEach(reminder => {
      if (reminder.time) {
        const hour = parseInt(reminder.time.split(':')[0]);
        if (hour >= 18) eveningReminders++;
        latestHour = Math.max(latestHour, hour);
      }
      if (reminder.priority === 'high') highPriorityCount++;

      if (reminder.category === 'Work' || reminder.category === 'Finance') workRelatedCount++;

      const text = (reminder.title + ' ' + (reminder.description || '')).toLowerCase();
      if (stressKeywords.some(keyword => text.includes(keyword))) {
        hasStressMentions = true;
      }
    });

    let baseSleep = 7.5;
    baseSleep -= (eveningReminders / userReminders.length) * 1.0;
    baseSleep -= (highPriorityCount / userReminders.length) * 0.8;
    baseSleep -= hasStressMentions ? 0.5 : 0;
    baseSleep = Math.max(4, Math.min(10, baseSleep));

    let consistency = 1.5;
    consistency += (highPriorityCount / userReminders.length) * 1.0;
    consistency += (eveningReminders / userReminders.length) * 0.5;
    consistency = Math.max(0.5, Math.min(3.0, consistency));

    return {
      predictedSleepDuration: Math.round(baseSleep * 10) / 10,
      predictedWakeupConsistency: Math.round(consistency * 10) / 10,
      analysis: {
        totalReminders: userReminders.length,
        eveningReminders,
        highPriorityCount,
        workRelatedCount,
        hasSleepMentions: false,
        hasStressMentions,
        latestReminderHour: latestHour
      },
      confidence: 0.7
    };
  };

  const generateWeeklyData = (baseSleep, consistency, analysis) => {
    const labels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    
    const weeklySleep = labels.map((_, index) => {
      const dayVariation = (Math.random() - 0.5) * consistency;
      const dayAdjustment = index >= 5 ? 0.8 : -0.3;
      const stressAdjustment = analysis.hasStressMentions ? -0.3 : 0;
      const workAdjustment = analysis.workRelatedCount > 2 ? -0.2 : 0;
      
      return Math.max(4, Math.min(10, baseSleep + dayVariation + dayAdjustment + stressAdjustment + workAdjustment));
    });

    const weeklyWakeup = labels.map((_, index) => {
      const baseTime = 7;
      const dayVariation = (Math.random() - 0.5) * consistency * 2;
      const dayAdjustment = index >= 5 ? 1.5 : 0;
      const priorityAdjustment = analysis.highPriorityCount > 0 ? -0.5 : 0;
      
      return Math.max(5, Math.min(10, baseTime + dayVariation + dayAdjustment + priorityAdjustment));
    });

    return { weeklySleep, weeklyWakeup };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Analyzing your reminders...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-bold text-[28px] sm:text-[32px] lg:text-[36px] text-neutral-700">
        Sleep Pattern Analysis
      </h1>
      
      {sleepData && (
        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">Predicted Sleep:</span>{' '}
              {sleepData.predictedSleepDuration}h
            </div>
            <div>
              <span className="font-semibold">Consistency Score:</span>{' '}
              {sleepData.predictedWakeupConsistency}
            </div>
            <div>
              <span className="font-semibold">Analysis Based on:</span>{' '}
              {sleepData.analysis.totalReminders} reminders
            </div>
          </div>
          
          {sleepData.analysis.hasStressMentions && (
            <div className="mt-2 text-amber-700 text-sm">
              ⚠️ Stress-related reminders detected - may affect sleep quality
            </div>
          )}
          
          {sleepData.analysis.eveningReminders > 0 && (
            <div className="mt-1 text-amber-700 text-sm">
              📝 {sleepData.analysis.eveningReminders} evening reminders found
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 mt-8">
        <WeeklySleepDuration sleepData={sleepData} />
        <WakeUpTimeConsistency sleepData={sleepData} />
      </div>
    </div>
  );
};


export default DashboardGraph;

const WeeklySleepDuration = ({ sleepData }) => {
  const labels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const weeklyData = sleepData 
    ? generateWeeklyData(
        sleepData.predictedSleepDuration, 
        sleepData.predictedWakeupConsistency,
        sleepData.analysis
      )
    : { weeklySleep: [7, 8, 5, 3, 6, 6, 8], weeklyWakeup: [6, 7, 8, 6, 5, 9, 5] };

  const data = {
    labels,
    datasets: [
      {
        label: "Predicted Sleep Hours",
        data: weeklyData.weeklySleep,
        backgroundColor: "#fcd34d",
        hoverBackgroundColor: "#d97706",
        borderRadius: {
          topLeft: 10,
          topRight: 10,
        },
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#0009",
          font: { size: 14, family: "sans-serif" },
        },
      },
      tooltip: {
        callbacks: {
          title: (context) => `${context[0].label}`,
          label: (context) => `Sleep: ${context.parsed.y} hours`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { display: false },
        title: {
          display: true,
          text: 'Hours'
        }
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="w-full h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
      <Bar data={data} options={options} />
    </div>
  );
};

const WakeUpTimeConsistency = ({ sleepData }) => {
  const labels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const weeklyData = sleepData 
    ? generateWeeklyData(
        sleepData.predictedSleepDuration, 
        sleepData.predictedWakeupConsistency,
        sleepData.analysis
      )
    : { weeklySleep: [7, 8, 5, 3, 6, 6, 8], weeklyWakeup: [6, 7, 8, 6, 5, 9, 5] };

  const data = {
    labels,
    datasets: [
      {
        label: "Predicted Wake-up Time",
        data: weeklyData.weeklyWakeup,
        fill: false,
        borderColor: "#fcd34d",
        backgroundColor: "#fbbf24",
        tension: 0.3,
        pointBackgroundColor: "#fbbf24",
        pointBorderColor: "#f59e0b",
        pointRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => `Wake-up: ${context.parsed.y}:00 AM`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Hour of the Day",
        },
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return value + ':00';
          }
        },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="w-full h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
      <Line data={data} options={options} />
    </div>
  );
};

function generateWeeklyData(baseSleep, consistency, analysis) {
  const labels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  
  const weeklySleep = labels.map((_, index) => {
    const variation = (Math.random() - 0.5) * consistency;
    const dayAdjustment = index >= 5 ? 0.8 : -0.3;
    return Math.max(4, Math.min(10, baseSleep + variation + dayAdjustment));
  });

  const weeklyWakeup = labels.map((_, index) => {
    const baseTime = 7;
    const variation = (Math.random() - 0.5) * consistency * 2;
    const dayAdjustment = index >= 5 ? 1.5 : 0;
    return Math.max(5, Math.min(10, baseTime + variation + dayAdjustment));
  });

  return { 
    weeklySleep: weeklySleep.map(h => Math.round(h * 10) / 10),
    weeklyWakeup: weeklyWakeup.map(h => Math.round(h * 10) / 10)
  };
}