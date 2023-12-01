const TuyAPI = require("tuyapi");

const device = new TuyAPI({
  id: process.env.DEVICE_ID,
  key: process.env.DEVICE_KEY,
});

let stateHasChanged = false;

const idMap = {
  1: "state",
  18: "current", // x = mA
  19: "power", // x / 10 = W
  20: "voltage", // x / 10 = V
  // "t", // unix time stamp
};

// Find device on network
device.find().then(() => {
  // Connect to device
  device.connect();
});

// Add event listeners
device.on("connected", () => {
  console.log("Connected to device!");
});

device.on("disconnected", () => {
  console.log("Disconnected from device.");
});

device.on("error", (error) => {
  console.log("Error!", error);
});

const state = {
  state: false,
  current: 0,
  power: 0,
  voltage: 0,
};

const logState = () =>
  console.log(
    `State: ${state.state}, Current: ${state.current} mA, Power: ${
      state.power / 10
    } W, Voltage: ${state.voltage / 10} V, P1: ${
      ((state.current * state.voltage) / 10) * 1000
    }`
  );

const updateState = (dps) => {
  if (!dps) {
    return;
  }

  Object.entries(dps).forEach(([key, value]) => {
    const mappedKey = idMap[key];
    if (mappedKey) {
      state[mappedKey] = value;
    }
  });

  logState();
};

device.on("data", (data) => {
  console.log("Data from device:", data);

  updateState(data.dps);

  // console.log(`Boolean status of default property: ${data.dps["1"]}.`);

  // Set default property to opposite
  // if (!stateHasChanged) {
  // device.set({ set: !data.dps["1"] });

  // Otherwise we'll be stuck in an endless
  // loop of toggling the state.
  // stateHasChanged = true;
  // }
});

device.on("dp-refresh", (data) => {
  console.log("DP_REFRESH data from device: ", data);
  updateState(data.dps);
});

// setInterval(() => {
//   device.refresh();
// }, 5000);

// // Disconnect after 10 seconds
// setTimeout(() => {
//   device.disconnect();
// }, 1000000);
