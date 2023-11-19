import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

export interface DataPoint {
  date: Date;
  t: number;
  h: number;
  v: number;
  b: number;
}

export interface ChartDataItem {
  name: string;
  points: DataPoint[];
}

const colors = ["#8BC1F7", "#F9E0A2", "#C9190B"];

export const Chart = (props: {
  title: string;
  items: ChartDataItem[];
  format: (value: string | number) => string;
  map: (point: DataPoint) => any;
}) => {
  return (
    <Line
      options={{
        plugins: {
          title: {
            display: true,
            text: props.title,
            color: "#555555",
            position: "top",
            font: {
              size: 14,
            },
            padding: {
              top: 10,
            },
          },
        },
        scales: {
          x: {
            type: "time",
          },
          y: {
            type: "linear",
            ticks: {
              callback: props.format,
            },
          },
        },
      }}
      data={{
        datasets: props.items.map((i, idx) => ({
          label: i.name,
          data: i.points.map((p) => ({ x: p.date, y: props.map(p) })),
          pointRadius: 0,
          backgroundColor: colors[idx],
          borderColor: colors[idx],
          borderWidth: 2,
        })),
      }}
    />
  );
};
