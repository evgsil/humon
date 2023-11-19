import React, { useEffect, useState } from "react";
import { Chart, ChartDataItem, DataPoint } from "./Chart";

const parseData = (data: Uint8Array): DataPoint[] => {
  const result: DataPoint[] = [];

  let idx = 0;
  do {
    if (data[idx] !== 255) {
      throw new Error(`Control byte is incorrect`);
    }

    const time =
      data[idx + 1] +
      data[idx + 2] * 256 +
      data[idx + 3] * 256 * 256 +
      data[idx + 4] * 256 * 256 * 256;

    const date = new Date(time * 1000);

    const t1 = data[idx + 5];
    const t2 = data[idx + 6];

    let tVal = t2 * 256 + t1;
    // if negative
    if (tVal > 32767) {
      tVal -= 65536;
    }

    const t = tVal / 100;
    const h = data[idx + 7] / 100;

    const b1 = data[idx + 8];
    const b2 = data[idx + 9];

    const v = (b2 * 256 + b1) / 1000;
    const b = v - 2.1; // 3.1 or above --> 100% 2.1 --> 0 %

    result.push({ date, t, h, v, b });

    idx += 10;
  } while (idx < data.length);

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
            .then((i) => parseData(new Uint8Array(i)))
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
