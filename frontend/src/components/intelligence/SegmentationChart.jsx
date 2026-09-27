import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

const CLUSTER_COLORS = ['#0F766E', '#A7C4A0', '#E88B72', '#78827F'];

export default function SegmentationChart({ guests = [], clusters = [] }) {
  const datasets = clusters.map((c, idx) => ({
    label: `${c.label} (${c.size})`,
    data: guests.filter((g) => g.clusterId === c.clusterId).map((g) => ({ x: g.x, y: g.y, name: g.name })),
    backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length],
    pointRadius: 6,
    pointHoverRadius: 8,
  }));

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: '#52605c', font: { family: 'Plus Jakarta Sans', size: 11 } } },
      tooltip: {
        backgroundColor: '#24312f',
        padding: 12,
        callbacks: {
          label: (ctx) => `${ctx.raw.name}: spend=${ctx.raw.x.toFixed(2)}, stay=${ctx.raw.y.toFixed(2)} (normalized)`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Normalized spend', color: '#78827f' }, min: -0.05, max: 1.05, grid: { color: 'rgba(232, 220, 200, 0.55)' }, border: { display: false }, ticks: { color: '#78827f' } },
      y: { title: { display: true, text: 'Normalized stay length', color: '#78827f' }, min: -0.05, max: 1.05, grid: { color: 'rgba(232, 220, 200, 0.55)' }, border: { display: false }, ticks: { color: '#78827f' } },
    },
  };

  return <div className="h-[320px] sm:h-[380px]"><Scatter data={{ datasets }} options={options} /></div>;
}
