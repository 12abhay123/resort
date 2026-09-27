import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
ChartJS.register(BarElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function RevenueChart({ history = [] }) {
  const labels = history.map((h) => new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  const data = {
    labels,
    datasets: [
      {
        label: 'Revenue ($)',
        data: history.map((h) => h.revenue),
        backgroundColor: '#0f766e',
        hoverBackgroundColor: '#a7c4a0',
        borderRadius: 7,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#24312f', padding: 12, displayColors: false, titleFont: { family: 'Plus Jakarta Sans' }, bodyFont: { family: 'Plus Jakarta Sans' } },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#78827f', font: { family: 'Plus Jakarta Sans', size: 10 } } },
      y: { grid: { color: 'rgba(232, 220, 200, 0.55)' }, border: { display: false }, ticks: { color: '#78827f', font: { family: 'Plus Jakarta Sans', size: 10 } } },
    },
  };
  return <div className="h-64 sm:h-72"><Bar data={data} options={options} /></div>;
}
