const path = require("path");
const {createClient} = require("../..");
const client = createClient({
  protoPath: path.resolve(__dirname, "./stream_greeter.proto"),
  packageName: "stream_greeter",
  serviceName: "StreamGreeter"
}, "0.0.0.0:50051");

function callClientStreamHello(){
  const call = client.clientStreamHello((err, res) => {
    if(err) throw err;
    console.log(res.message);
  });
  call.write({ message: "Hello!" });
  call.write({ message: "How are you?" });
  call.end();
}

function callServerStreamHello(){
  const call = client.serverStreamHello({ message: "Hello! How are you?" });
  call.on("data", (chunk) => {
    console.log(chunk.message);
  });
  call.on("end", () => {
    //exec when server streaming ended.
  });
}

function callMutualStreamHello(){
  const call = client.mutualStreamHello();
  call.on("data", (chunk) => {
    console.log(chunk.message);
  });
  call.on("end", () => {
    //exec when server streaming ended.
  });
  call.write({ message: "Hello!" });
  call.write({ message: "How are you?" });
  call.end();
}

callClientStreamHello();
callServerStreamHello();
callMutualStreamHello();