const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
const port = process.argv[2] || 3001;

const util = require("util");

const headersByExtension = {
  ".html": {
    "Content-Type": "text/html",
    "Cache-Control": "nocache, nostore",
  },
  ".dat": {
    "Content-Type": "application/octet-stream",
    "Cache-Control": "nocache, nostore",
  },
  ".css": {
    "Content-Type": "text/css",
    "Cache-Control": "public, max-age=604800",
  },
  ".js": {
    "Content-Type": "text/javascript",
    "Cache-Control": "public, max-age=604800",
  },
  ".json": {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=604800",
  },
  ".png": {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=604800",
  },
  ".svg": {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "public, max-age=604800",
  },
};

const exists = util.promisify(fs.exists);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);

http
  .createServer(async (request, response) => {
    try {
      const uri = url.parse(request.url).pathname;
      console.log("uri", uri);

      if (uri === "/list-data") {
        const files = await readdir(process.cwd());

        response.writeHead(200, { "Content-Type": "application/json" });
        response.write(
          JSON.stringify(files.filter((i) => path.extname(i) === ".dat"))
        );
        response.end();
        return;
      }

      const fileExt = path.extname(uri);

      let filename =
        fileExt === ".dat"
          ? path.join(process.cwd(), uri)
          : path.join(process.cwd(), "ui/build", uri);

      if (!(await exists(filename))) {
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.write("404 Not Found\n");
        response.end();
        return;
      }

      if ((await stat(filename)).isDirectory()) {
        filename += "/index.html";
      }

      const file = await readFile(filename, "binary");
      response.writeHead(200, headersByExtension[fileExt] || {});
      response.write(file, "binary");
      response.end();
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.write(error + "\n");
      response.end();
    }
  })
  .listen(parseInt(port, 10));

console.log(`Server is running at http://localhost:${port}`);
