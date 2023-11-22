import React, { useEffect, useState } from "react";
import { Chart, ChartDataItem, DataPoint } from "./Chart";

const parseData = (data: DataView): DataPoint[] => {
  const result: DataPoint[] = [];

  let idx = 0;
  do {
    if (data.getUint8(idx) !== 255) {
      throw new Error(`Control byte is incorrect ${data.getInt8(idx)} `);
    }

    const time = data.getUint32(idx + 1, true);

    const date = new Date(time * 1000);

    const t = data.getInt16(idx + 5, true) / 100;
    const h = data.getUint8(idx + 7) / 100;

    const v = data.getUint16(idx + 8, true) / 1000;
    const b = v - 2.1; // 3.1 or above --> 100% 2.1 --> 0 %

    result.push({ date, t, h, v, b });

    idx += 10;
  } while (idx < data.byteLength);

  return result;
};

const App = () => {
  const [items, setItems] = useState<ChartDataItem[]>([]);

  useEffect(() => {
    (async () => {
      const response = await fetch("/list-data");
      const value: string[] = await response.json();

      const datasets = await Promise.all(
        value.map((i) =>
          fetch(`/${i}`)
            .then((i) => i.blob())
            .then((i) => i.arrayBuffer())
            .then((i) => parseData(new DataView(i)))
        )
      );

      setItems(
        value.map<ChartDataItem>((name, idx) => ({
          name,
          points: datasets[idx],
        }))
      );
    })();
  }, []);

  return (
    <div className="App">
      <Chart
        title="Temperature"
        items={items}
        map={(p) => p.t}
        format={(value) => `${value.toLocaleString(undefined, {})}\u00B0`}
      />
      <Chart
        title="Humidity"
        items={items}
        map={(p) => p.h}
        format={(value) =>
          value.toLocaleString(undefined, {
            style: "percent",
          })
        }
      />
      <Chart
        title="Battery"
        items={items}
        map={(p) => p.b}
        format={(value) =>
          value.toLocaleString(undefined, {
            style: "percent",
          })
        }
      />
    </div>
  );
};

export default App;
