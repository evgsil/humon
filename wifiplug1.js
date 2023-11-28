const { Find } = require("@tuyapi/driver");

const find = new Find();

find.on("broadcast", (sss) => {
  console.log("broadcast", sss);
});

find.on("error", (sss) => {
  console.log("error", sss);
});

find.start();
