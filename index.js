const {createBluetooth} = require('node-ble')
const {bluetooth, destroy} = createBluetooth()

const  main = async () => {
  const adapter = await bluetooth.defaultAdapter();

  if (! await adapter.isDiscovering()) {
    await adapter.startDiscovery()
  }

  const device = await adapter.waitDevice('A4:C1:38:8B:3A:03')
  console.log('Device found');

  await device.connect();
  console.log('Connected');

  const gattServer = await device.gatt()


  const result = await device.getName();
  console.log(result);


  await device.disconnect()
  destroy()
}


main();
