const path = require("path");
const {createServer} = require("../..");
const server = createServer();

server.use({
  protoPath: path.resolve(__dirname, "./greeter.proto"),
  packageName: "greeter",
  serviceName: "Greeter",
  routes: {
    hello: (call, callback) => {
      callback(null, { message: `Hello, ${call.request.name}` });
    },
    goodbye: async (call) => {
      return { message: `Goodbye, ${call.request.name}` };
    }
  }
});

server.listen("0.0.0.0:50051");