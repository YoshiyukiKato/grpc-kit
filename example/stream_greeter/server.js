const path = require("path");
const {createServer} = require("../..");
const server = createServer();
server.use({
  protoPath: path.resolve(__dirname, "./stream_greeter.proto"),
  packageName: "stream_greeter",
  serviceName: "StreamGreeter",
  routes: {
    clientStreamHello: (call, callback) => {
      call.on("data", (chunk) => {
        //exec when client wrote message
        console.log(chunk.message);
      });
      call.on("end", (chunk) => {
        callback(null, { message: "Hello! I'm fine, thank you!" })
      });
    },

    serverStreamHello: (call) => {
      console.log(call.request.message);
      call.write({ message: "Hello!" });
      call.write({ message: "I'm fine, thank you" });
      call.end();
    },

    mutualStreamHello: (call) => {
      call.on("data", (chunk) => {
        //exec when client wrote message
        console.log(chunk.message);
        if(chunk.message === "Hello!"){
          call.write({ message: "Hello!" });
        } else if(chunk.message === "How are you?"){
          call.write({ message: "I'm fine, thank you" });
        } else {
          call.write({ message: "pardon?" });
        }
      });
      call.on("end", (chunk) => {
        call.end();
      });
    }
  }
});

server.listen("0.0.0.0:50051");