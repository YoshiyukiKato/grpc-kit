const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");

function createClient({ protoPath, packageName, serviceName, options }, address, creds=grpc.credentials.createInsecure()){
  const proto = grpc.loadPackageDefinition(protoLoader.loadSync(protoPath, options))[packageName];
  return new proto[serviceName](address, creds);
}

function createServer(){
  return new GrpcServer();
}

class GrpcServer {
  constructor(){
    this.server = new grpc.Server();
  }

  use({ protoPath, packageName, serviceName, routes, options }){
    const proto = grpc.loadPackageDefinition(protoLoader.loadSync(protoPath, options))[packageName];
    const router = Object.entries(routes).reduce((_router, [action, handler]) => {
      _router[action] = handleWhetherAsyncOrNot(handler);
      return _router;
    }, {});
    this.server.addService(proto[serviceName].service, router);
    return this;
  }
  
  listen(address, creds=grpc.ServerCredentials.createInsecure()){
    this.server.bind(address, creds);
    this.server.start();
    return this;
  }

  close(force=false, cb){
    if(force){
      this.server.forceShutdown();
    }else{
      this.server.tryShutdown(cb);
    }
    return this;
  }
}

function handleWhetherAsyncOrNot(handler){
  return (call, callback) => {
    const mightBePromise = handler(call, callback);
    if(mightBePromise && mightBePromise.then && mightBePromise.catch){
      return mightBePromise
        .then((result) => callback(null, result))
        .catch((err) => callback(err));
    }
  }
}

exports.createClient = createClient;
exports.createServer = createServer;