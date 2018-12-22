const path = require("path");
const assert = require("power-assert");
const {createServer, createClient} = require("../index");

const PROTO_PATH = path.resolve(__dirname, "./fixture/greeter.proto");

const server = createServer();
server.use({
  protoPath: PROTO_PATH,
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

const client = createClient({
  protoPath: PROTO_PATH,
  packageName: "greeter",
  serviceName: "Greeter"
}, "0.0.0.0:50051");

describe("grpc-kit", () => {
  before(() => {
    server.listen("0.0.0.0:50051");
  });
  
  it("says hello", (done) => {
    client.hello({ name: "Jack" }, (err, {message}) => {
      if (err) {
        assert(err);
      } else {
        assert(message === "Hello, Jack");
      };
      done();
    });
  });

  it("says goodbye", (done) => {
    client.goodbye({ name: "John" }, (err, {message}) => {
      if (err) {
        assert(err);
      } else {
        assert(message === "Goodbye, John");
      };
      done();
    });
  });
  
  after((done) => {
    server.close(false, () => {
      done();
    });
  });
});