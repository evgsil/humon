const { createBluetooth } = require("node-ble");
const { bluetooth, destroy } = createBluetooth();
const fs = require("fs");

const appendData = async (fileName, data) => {
  if (data.length !== 5) {
    throw new Error(`Data size is not correct: ${data.length}`);
  }

  const record = Buffer.alloc(10); // 1 control byte, 4 bytes unixtimestamp, 2 bytes temp, 1 byte humidity, 2 bytes voltage
  record.writeUInt8(255, 0); // control byte
  record.writeUInt32LE(Math.floor(new Date().valueOf() / 1000), 1);
  data.copy(record, 5, 0, 5);

  const file = fs.createWriteStream(fileName, {
    flags: "a",
    encoding: "binary",
  });

  return new Promise((resolve) => file.end(record, resolve));
};

const parseBuffer = (buffer) => {
  if (buffer.length !== 5) {
    throw new Error(`Buffer has incorrect size: ${buffer.length}`);
  }

  const t = buffer.readInt16LE(0) / 100;
  const h = buffer.readInt8(2);
  const v = buffer.readInt16LE(3) / 1000;

  const b = Math.min(Math.round((v - 2.1) * 100), 100); // 3.1 or above --> 100% 2.1 --> 0 %

  return { t, h, v, b };
};

const debugLog = (message) => {
  process.stdout.write(`${message}\n`);
};

const devices = [
  { name: "out1", mac: "A4:C1:38:8B:3A:03" },
  { name: "gar1", mac: "A4:C1:38:4D:66:9C" },
  { name: "gar2", mac: "A4:C1:38:09:79:38" },
  // { name: "non1", mac: "A4:C1:38:73:12:6C" },
];

const readData = async (adapter, { mac, name }) => {
  debugLog(`[${name}] Searching device ${mac} ...`);
  const device = await adapter.waitDevice(mac, 30 * 1000);

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

  const result = await new Promise((resolve, reject) =>
    characteristic.on("valuechanged", resolve)
  );

  debugLog(`[${name}] Disconnecting...`);
  await device.disconnect();

  return result;
};

const timeout = (time) =>
  new Promise((resolve, reject) =>
    setTimeout(() => reject(new Error("Exited by timeout")), time)
  );

const main = async () => {
  debugLog(`Getting adapter...`);
  const adapter = await bluetooth.defaultAdapter();

  if (!(await adapter.isDiscovering())) {
    debugLog(`Starting discovery...`);
    await adapter.startDiscovery();
  }

  for (const { mac, name } of devices) {
    try {
      const result = await Promise.race([
        readData(adapter, { mac, name }),
        timeout(60 * 1000),
      ]);

      const { t, h, v, b } = parseBuffer(result);

      debugLog(
        `[${name}] Temperature: ${t}, Humidity: ${h}, Voltage: ${v}, Battery: ${b}%`
      );

      debugLog(`[${name}] Saving data...`);
      await appendData(`${name}.dat`, result);
    } catch (error) {
      process.stderr.write(`[${name}] Error: ${error.message}\n`);
    }
  }

  destroy();
  process.exit();
};

main().catch(process.stderr);
