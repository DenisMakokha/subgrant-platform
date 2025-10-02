import React, { useMemo } from 'react';
import { useCapabilities } from '../../../../hooks/useCapabilities';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * ChartWidget - Chart display widget with Chart.js integration
 * 
 * Features:
 * - Multiple chart types (line, bar, pie, donut)
 * - Responsive design
 * - Loading states
 * - Empty states
 * - Legend support
 * - Modern styling with gradients
 */

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface ChartWidgetProps {
  title: string;
  subtitle?: string;
  type: 'line' | 'bar' | 'pie' | 'donut';
  data: ChartDataPoint[];
  capability?: string;
  loading?: boolean;
  height?: number;
}

export default function ChartWidget({
  title,
  subtitle,
  type,
  data,
  capability,
  loading = false,
  height = 300
}: ChartWidgetProps) {
  const { hasCapability } = useCapabilities();

  if (capability && !hasCapability(capability)) {
    return null;
  }

  // Generate gradient colors for charts
  const generateColors = (count: number) => {
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // blue
      'rgba(16, 185, 129, 0.8)',   // green
      'rgba(168, 85, 247, 0.8)',   // purple
      'rgba(251, 146, 60, 0.8)',   // orange
      'rgba(236, 72, 153, 0.8)',   // pink
      'rgba(14, 165, 233, 0.8)',   // sky
      'rgba(245, 158, 11, 0.8)',   // amber
      'rgba(239, 68, 68, 0.8)',    // red
    ];
    return colors.slice(0, count);
  };

  const chartData = useMemo(() => {
    const labels = data.map(d => d.label);
    const values = data.map(d => d.value);
    const colors = data.map((d, i) => d.color || generateColors(data.length)[i]);

    if (type === 'line') {
      return {
        labels,
        datasets: [{
          label: title,
          data: values,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      };
    }

    if (type === 'bar') {
      return {
        labels,
        datasets: [{
          label: title,
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.8', '1')),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      };
    }

    // Pie and Donut
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#fff',
        borderWidth: 3,
        hoverOffset: 10
      }]
    };
  }, [data, type, title]);

  const chartOptions = useMemo(() => {
    const baseOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: type === 'pie' || type === 'donut',
          position: 'bottom' as const,
          labels: {
            padding: 15,
            font: {
              size: 12,
              family: "'Inter', sans-serif"
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          cornerRadius: 8,
          displayColors: true
        }
      }
    };

    if (type === 'line' || type === 'bar') {
      baseOptions.scales = {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: {
              size: 11
            }
          }
        }
      };
    }

    if (type === 'donut') {
      baseOptions.cutout = '70%';
    }

    return baseOptions;
  }, [type]);

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={chartData} options={chartOptions} />;
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />;
      case 'pie':
        return <Pie data={chartData} options={chartOptions} />;
      case 'donut':
        return <Doughnut data={chartData} options={chartOptions} />;
      default:
        return null;
    }
  };

  return (
    <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700">
      {/* Gradient Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ height: `${height}px` }}>
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
          </div>
        ) : (
          <div style={{ height: `${height}px` }}>
            {renderChart()}
          </div>
        )}
      </div>
    </div>
  );
}
