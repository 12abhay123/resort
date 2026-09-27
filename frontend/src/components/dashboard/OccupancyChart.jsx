import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

export default function OccupancyChart({ history = [], regressionLine = [] }) {
  const labels = history.map((h) => new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

  const data = {
    labels,
    datasets: [
      {
        label: 'Actual occupancy %',
        data: history.map((h) => h.occupancyPercentage),
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15,118,110,0.1)',
        tension: 0.35,
        fill: true,
        pointRadius: 2,
      },
      regressionLine.length
        ? {
            label: 'Regression fit',
            data: regressionLine.map((p) => p.y),
            borderColor: '#a7c4a0',
            borderDash: [6, 4],
            pointRadius: 0,
            tension: 0,
          }
        : null,
    ].filter(Boolean),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: '#52605c', font: { family: 'Plus Jakarta Sans', size: 11 } } }, tooltip: { backgroundColor: '#24312f', padding: 12 } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#78827f', font: { family: 'Plus Jakarta Sans', size: 10 } } },
      y: { min: 0, max: 100, grid: { color: 'rgba(232, 220, 200, 0.55)' }, border: { display: false }, ticks: { color: '#78827f', callback: (v) => `${v}%` } },
    },
  };

  return <div className="h-64 sm:h-72"><Line data={data} options={options} /></div>;
}
