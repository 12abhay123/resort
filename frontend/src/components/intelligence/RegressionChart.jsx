import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function RegressionChart({ history = [], regressionLine = [] }) {
  const labels = history.map((_, i) => `Day ${i + 1}`);
  const data = {
    labels,
    datasets: [
      { label: 'Actual', data: history.map((h) => h.occupancyPercentage), borderColor: '#0f766e', backgroundColor: 'rgba(15,118,110,0.08)', pointRadius: 3, tension: 0.2 },
      { label: 'Fitted line (ml-regression)', data: regressionLine.map((p) => p.y), borderColor: '#a7c4a0', borderDash: [6, 4], pointRadius: 0 },
    ],
  };
  const options = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: '#52605c', font: { family: 'Plus Jakarta Sans', size: 11 } } }, tooltip: { backgroundColor: '#24312f', padding: 12 } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#78827f' } }, y: { min: 0, max: 100, grid: { color: 'rgba(232, 220, 200, 0.55)' }, border: { display: false }, ticks: { color: '#78827f' } } } };
  return <div className="h-64 sm:h-72"><Line data={data} options={options} /></div>;
}
