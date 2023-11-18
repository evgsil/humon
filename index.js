const { createBluetooth } = require("node-ble");
const { bluetooth, destroy } = createBluetooth();

const debugLog = (message) => {
  process.stdout.write(`${message}\n`);
};

const devices = [
  { name: "out1", mac: "A4:C1:38:8B:3A:03" },
  { name: "gar1", mac: "A4:C1:38:4D:66:9C" },
  { name: "gar2", mac: "A4:C1:38:09:79:38" },
  // { name: "nei?", mac: "A4:C1:38:73:12:6C" },
];

const main = async () => {
  debugLog(`Getting adapter...`);
  const adapter = await bluetooth.defaultAdapter();

  if (!(await adapter.isDiscovering())) {
    debugLog(`Starting discovery...`);
    await adapter.startDiscovery();
  }

  for (const { mac, name } of devices) {
    debugLog(`[${name}] Searching device ${mac} ...`);
    const device = await adapter.waitDevice(mac);

    debugLog(`[${name}] Connecting device...`);
    await device.connect();

    debugLog(`[${name}] Getting gatt server...`);
    const gattServer = await device.gatt();

    debugLog(`[${name}] Getting data service...`);
    const service = await gattServer.getPrimaryService(
      "ebe0ccb0-7a0a-4b0c-8a1a-6ff2997da3a6"
    );
    debugLog(`[${name}] Getting data characteristic...`);
    const characteristic = await service.getCharacteristic(
      "ebe0ccc1-7a0a-4b0c-8a1a-6ff2997da3a6"
    );

    debugLog(`[${name}] Subscribing to data notifications...`);
    await characteristic.startNotifications();

    const { t, h, v, b } = await new Promise((resolve, reject) => {
      characteristic.on("valuechanged", (buffer) => {
        if (buffer.length < 5) {
          reject(new Error(`[${name}] Buffer to small: ${buffer.length}`));
          return;
        }

        const t1 = buffer[0];
        const t2 = buffer[1];

        let tVal = t2 * 256 + t1;
        // if negative
        if (tVal > 32767) {
          tVal -= 65536;
        }

        const t = tVal / 100;
        const h = buffer[2];

        const b1 = buffer[3];
        const b2 = buffer[4];

        const v = (b2 * 256 + b1) / 1000;
        const b = Math.min(Math.round((v - 2.1) * 100), 100); // 3.1 or above --> 100% 2.1 --> 0 %

        resolve({ t, h, v, b });
        f;
      });
    });

    debugLog(
      `[${name}] Temperature: ${t}, Humidity: ${h}, Voltage: ${v}, Battery: ${b}%`
    );

    debugLog(`[${name}] Disconnecting...`);
    await device.disconnect();
  }

  destroy();
};

main().catch(process.stderr);
// main("A4:C1:38:73:12:6C").catch(process.stderr);

// debugLog(`getName: ${await device.getName()}`);
// debugLog(`getAddress: ${await device.getAddress()}`);
// debugLog(`getAddressType: ${await device.getAddressType()}`);
// debugLog(`getAlias: ${await device.getAlias()}`);
// debugLog(`getRSSI: ${await device.getRSSI()}`);
// debugLog(`toString: ${await device.toString()}`);

// const services = await gattServer.services();
// debugLog("retreiving services");

// for (const sid of services) {
//   debugLog(`Service: ${sid}`);
//   const service = await gattServer.getPrimaryService(sid);
//   const chars = await service.characteristics();
//   debugLog("Characteristics");
//   debugLog(chars.join("\n"));
// }

// const result = await device.getName();
// debugLog(result);

// Service: ebe0ccb0-7a0a-4b0c-8a1a-6ff2997da3a6
// char ebe0ccc1-7a0a-4b0c-8a1a-6ff2997da3a6
