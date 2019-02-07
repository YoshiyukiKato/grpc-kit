const path = require("path");
const assert = require("power-assert");
const {createServer, createClient} = require("../index");

const PROTO_PATH = path.resolve(__dirname, "./fixture/greeter.proto");
const NESTED_PROTO_PATH = path.resolve(__dirname, "./fixture/nested.proto");

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
    },
    niceToMeetYou: (call) => {
      call.write({ message: `Hi, ${call.request.name}.` });
      call.write({ message: "I am Greeter." });
      call.write({ message: "Nice to meet you!" });
      call.end();
    },
    cheerUp: (call, callback) => {
      call.on("data", (grumbleChunk) => {});
      call.on("end", () => {
        callback(null, { message: "Cheer up. Tommorow is Friday." });
      });
    },
    chat: (call) => {
      call.on("data", (chunk) => {
        if(chunk.message === "Hi") {
          call.write({ message: "Hi" });
        } else if (chunk.message === "How are you?"){
          call.write({ message: "I'm fine!" });
        } else {
          call.write({ message: "pardon?" });
        }
      });
      call.on("end", () => {
        call.end();
      });
    }
  }
});
server.use({
  protoPath: NESTED_PROTO_PATH,
  packageName: "greeter.v1",
  serviceName: "NestedGreeter",
  routes: {
    hello: (call, callback) => {
      callback(null, { message: `Hello, ${call.request.name}` });
    },
    goodbye: async (call) => {
      return { message: `Goodbye, ${call.request.name}` };
    },
  }
});

const client = createClient({
  protoPath: PROTO_PATH,
  packageName: "greeter",
  serviceName: "Greeter"
}, "0.0.0.0:50051");

const nested_client = createClient({
  protoPath: NESTED_PROTO_PATH,
  packageName: "greeter.v1",
  serviceName: "NestedGreeter"
}, "0.0.0.0:50051");

describe("grpc-kit", () => {
  before(() => {
    server.listen("0.0.0.0:50051");
  });
  
  it("says hello", (done) => {
    client.hello({ name: "Jack" }, (err, res) => {
      if (err) {
        assert(err);
      } else {
        assert(res.message === "Hello, Jack");
      };
      done();
    });
  });

  it("says goodbye", (done) => {
    client.goodbye({ name: "John" }, (err, res) => {
      if (err) {
        assert(err);
      } else {
        assert(res.message === "Goodbye, John");
      };
      done();
    });
  });

  it("says nice to meet you", (done) => {
    const call = client.niceToMeetYou({ name: "Linda" });
    const messages = [];
    call.on("data", (chunk) => {
      messages.push(chunk.message);
    });
    call.on("end", () => {
      assert.deepEqual(messages, ["Hi, Linda.", "I am Greeter.", "Nice to meet you!"]);
      done();
    });
  });

  it("cheers up", (done) => {
    const call = client.cheerUp((err, res) => {
      if(err){
        assert(err);
      }else{
        assert(res.message === "Cheer up. Tommorow is Friday.");
      }
      done();
    });
    call.write({ message: "Phew..." });
    call.write({ message: "I'm so tired..." });
    call.write({ message: "I want to quit my job..." });
    call.end();
  });

  it("chats", (done) => {
    const call = client.chat();
    const messages = [];
    call.on("data", (chunk) => {
      messages.push(chunk.message);
    });
    call.on("end", () => {
      assert.deepEqual(messages, ["Hi", "I'm fine!"]);
      done();
    });
    call.write({ message: "Hi" });
    call.write({ message: "How are you?" });
    call.end();
  });

  after((done) => {
    server.close(false, () => {
      done();
    });
  });

  it("says nested package hello", (done) => {
    nested_client.hello({ name: "Jack" }, (err, res) => {
      if (err) {
        assert(err);
      } else {
        assert(res.message === "Hello, Jack");
      };
      done();
    });
  });

  it("says nested package goodbye", (done) => {
    nested_client.goodbye({ name: "John" }, (err, res) => {
      if (err) {
        assert(err);
      } else {
        assert(res.message === "Goodbye, John");
      };
      done();
    });
  });
});
