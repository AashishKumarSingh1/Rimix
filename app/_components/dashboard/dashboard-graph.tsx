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

const DashboardGraph = () => {
  return (
    <div>
      <h1 className="font-bold text-[28px] sm:text-[32px] lg:text-[36px] text-neutral-700">
        Welcome, Sir
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 mt-12">
        <WeekklySleepDuration />
        <WakeUpTimeConsistency />
      </div>
    </div>
  );
};

export default DashboardGraph;

const WeekklySleepDuration = () => {
  const labels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const data: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        label: "Weekly Health Report",
        data: [7, 8, 5, 3, 6, 6, 8],
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

  const options: ChartOptions<"bar"> = {
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

const WakeUpTimeConsistency = () => {
  const labels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const data: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Wake up Time Consistency",
        data: [6, 7, 8, 6, 5, 9, 5],
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

  const options: ChartOptions<"line"> = {
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
