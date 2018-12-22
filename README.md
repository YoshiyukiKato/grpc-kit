# grpc-kit
use grpc more simply.

## proto
```proto
syntax="proto3";

package greeter;

service Greeter {
  rpc Hello (RequestGreet) returns (ResponseGreet) {}
  rpc Goodbye (RequestGreet) returns (ResponseGreet) {}
}

message RequestGreet {
  string name = 1;
}

message ResponseGreet {
  string message = 1;
}
```

## Server
```js
const {createServer} = require("grpc-kit");
const server = createServer();

server.use({
  protoPath: "/path/to/greeter.proto",
  packageName: "greeter",
  serviceName: "Greeter",
  routes: {
    hello: (call, callback) => {
      callback(null, `Hello, ${call.request.name}`);
    },
    goodbye: (call, callback) => {
      callback(null, `Goodbye, ${call.request.name}`);
    }
  }
});
server.listen("0.0.0.0:50051");
```

## Client
```js
const {createClient} = require("grpc-kit");
const client = createClient({
  protoPath: "/path/to/greeter.proto",
  packageName: "greeter",
  serviceName: "Greeter"
}, "0.0.0.0:50051");

client.hello({ name: "jack" }, (err, message) => {
  if(err) throw err;
  console.log(message);
});
```