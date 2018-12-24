# grpc-kit
[![npm version](https://badge.fury.io/js/grpc-kit.svg)](https://badge.fury.io/js/grpc-kit)

Use grpc more simply on Node.js.

## quick start
### install
```sh
$ npm install grpc @grpc/proto-loader grpc-kit
```

### proto
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

### Server
```js
const {createServer} = require("grpc-kit");
const server = createServer();

server.use({
  protoPath: "/path/to/greeter.proto",
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
```

### Client
```js
const {createClient} = require("grpc-kit");
const client = createClient({
  protoPath: "/path/to/greeter.proto",
  packageName: "greeter",
  serviceName: "Greeter"
}, "0.0.0.0:50051");

client.hello({ name: "Jack" }, (err, { message }) => {
  if(err) throw err;
  console.log(message);
});

client.goodbye({ name: "John" }, (err, { message }) => {
  if(err) throw err;
  console.log(message);
});
```

## use stream
### proto
```proto
syntax="proto3";

package stream_greeter;

service StreamGreeter {
  rpc ClientStreamHello(stream Message) returns(Message) {}
  rpc ServerStreamHello(Message) returns(stream Message) {}
  rpc MutualStreamHello (stream Message) returns (stream Message) {}
}

message Message {
  string message = 1;
}
```

### Server
```js
const {createServer} = require("grpc-kit");
const server = createServer();

server.use({
  protoPath: "/path/to/stream_greeter.proto"),
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
```

### Client
```js
const {createClient} = require("grpc-kit");
const client = createClient({
  protoPath: "/path/to/stream_greeter.proto",
  packageName: "stream_greeter",
  serviceName: "StreamGreeter"
}, "0.0.0.0:50051");
```
#### client stream
```js
const call = client.clientStreamHello((err, res) => {
  if(err) throw err;
  console.log(res.message);
});
call.write({ message: "Hello!" });
call.write({ message: "How are you?" });
call.end();
```
#### server stream
```js
const call = client.serverStreamHello({ message: "Hello! How are you?" });
call.on("data", (chunk) => {
  console.log(chunk.message);
});
call.on("end", () => {
  //exec when server streaming ended.
});
```
#### mutual stream
```js
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
```

## api
### createServer(): GrpcServer
Create `GrpcServer` instance. `GrpcServer` is a wrapper class of `grpc.Server` providing simplified api to register services.

### GrpcServer.use({`protoPath`,`packageName`,`serviceName`,`routes`}): GrpcServer
Register a service to provide from a server.

|arg name|type|required/optional|description|
|:-------|:---|:----------------|:----------|
|**`protoPath`**|String|Required|path to `.proto` file|
|**`packageName`**|String|Required|name of package|
|**`serviceName`**|String|Required|name of service|
|**`routes`**|{ \[methodName\]:(call, callback) => void \| (call) => Promise<any> }|Required|routing map consists of a set of pair of method name and handler. Both of sync function and async function are available as a handler|

### GrpcServer.listen(`address_port`, `credentials`): GrpcServer
Start server. Alias to `grpc.Server.bind()` and `grpc.Server.start()`.

|arg name|type|required/optional|description|
|:-------|:---|:----------------|:----------|
|**`address_port`**|String|Required|address and port of server to listen|
|**`credentials`**|grpc.ServerCredentials|Optional|grpc server credentials. Default to insecure credentials generated by `grpc.ServerCredentials.createInsecure()`|

### GrpcServer.close(`force`, `callback`): GrpcServer
Close server. Alias to `grpc.Server.tryShutdown()` and `grpc.Server.forceShutdown`.

|arg name|type|required/optional|description|
|:-------|:---|:----------------|:----------|
|**`force`**|Boolean|Optional|flag if force shutdown or not. Default to `false`|
|**`callback`**|()=>{}|Optional|call when shutdown completed. available only when `force` is `false`|

### createClient({`protoPath`,`packageName`,`serviceName`},`address_port`,`credentials`): grpc.Client
Create `grpc.Client` instance.

|arg name|type|required/optional|description|
|:-------|:---|:----------------|:----------|
|**`protoPath`**|String|Required|path to `.proto` file|
|**`packageName`**|String|Required|name of package|
|**`serviceName`**|String|Required|name of service|
|**`address_port`**|String|Required|address and port of server to listen|
|**`credentials`**|grpc.ChannelCredentials|Optional|grpc channel credentials. Default to insecure credentials generated by `grpc.credentials.createInsecure()`|