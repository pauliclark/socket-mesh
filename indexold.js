const io = require("socket.io");
/*
    {
        core:{
            connect:[],
            allow:['satelliteA','satelliteB'],
            port:3000,
            url:'http://localhost',
            methods:{
                test:{
                    response:true,
                    method:function(from,data) {
                        return {from:from,data:data};
                    }
                }
            }
        },
        satelliteA:{
            connect:['core'],
            allow:['satelliteB'],
            port:3001,
            url:'http://localhost',
            methods:{
                test:{
                    response:true,
                    method:function(from,data) {
                        return {from:from,data:data};
                    }
                }
            }
        },
        satelliteB:{
            connect:['core','satelliteA'],
            allow:[],
            port:3002,
            url:'http://localhost',
            methods:{
                test:{
                    response:true,
                    method:function(from,data) {
                        return {from:from,data:data};
                    }
                }
            }
        }
    }
*/
const attachedClient = class{
    constructor(mesh,server,client) {
        this.mesh=mesh;
        this.server=server;
        this.client=client;
        this.identity=null;
        this.methods={};
        client.on('identify', data => {
            if (this.server.schema.allow.indexOf(data.identity) > 0) {
                this.server.clients[data.identity] = this;
                this.identity=data.identity;
                client.emit('approved', {});
                this.createMethods();
            } else {
                delete this.server.clients[data.identity]
                // not allowed
            }
        });
        if (this.server.schema.methods) {
            for (var method in this.server.schema.methods) {
                if (this.server.schema.methods[method].response) {
                    // create request/response
                    this.client.on(method, data => {
                        if (data.guid) {
                            this.client.emit('response', {
                                guid: guid,
                                payload: await this.server.schema.methods[method](data.payload)
                            })
                        }
                    });
                } else {
                    // handle request
                    this.client.on(method, data => {
                        await this.server.schema.methods[method](data.payload)
                    });
                }
            }
        }
        client.on('disconnect', () => {
            delete this.clients[clientIdentity]
        });
    }
    
    createMethods() {
        if (this.mesh.nodes[this.identity]) {
            this.client.on("response",function(data) {
                if (data.guid) {

                }
            })
            for (var method in this.mesh.nodes[this.identity].schema.methods) {
                this.methods[method]=function(data) {
                    this.client.emit(method,{guid:guid(),payload:data})
                }
            }
        }
    }
}
const clientWrapper = class {
    constructor(mesh,serverIdentity) {
        this.mesh=mesh;
        this.client = require('socket.io-client')(this.mesh.fullSchema[identity].url + (this.mesh.fullSchema[identity].port ? `:${this.mesh.fullSchema[identity].port}` : ''));

        this.client.on('connect', function () {
            this.client.on('approved',function() {
                this.mesh.servers[identity]=this;
            });
            this.client.emit("identify",{identity:this.identity})
        });
        this.client.on('disconnect', function () {
            delete this.mesh.servers[identity]
        });
    }
}
const socketnode = class {
    constructor(mesh, identity, schema) {
        this.mesh = mesh;
        this.identity = identity;
        this.fullSchema = schema;
        this.schema = schema[identity];
        this.server = null;
        if (this.schema.allow && this.schema.allow.length > 0) this.createServer();
        if (this.schema.connect && this.schema.connect.length > 0) this.createClients();
        this.clients = {};
        //this.servers = {};
    }
    createServer() {
        this.mesh.httpserver = this.mesh.httpserver || require('http').createServer();
        this.server = io(this.httpserver);
        this.serverMethods={};
       /* for(var method in this.schema.methods) {
            this.serverMethods[method]=async function(data) {
                if (!!this.schema.methods[method].response) {
                    return await this.schema.methods[method].method(data);
                }else{
                    this.schema.methods[method].method();
                }
            }
        }*/
        this.server.on('connection', client => {
            new attachedClient(this.mesh,this,client);
        });
        if (!this.mesh.customServer) this.httpserver.listen(this.schema.port || 3000);
    }
    createClients() {
        this.clients = {};
        this.schema.connect.forEach(identity => {
            this.clients[identity] = new clientWrapper(this.mesh,identity);
        })
    }
    send(identity, method, data) {
        if (this.clients[identity] && this.clients[identity][method]) {
            return await this.clients[identity][method](data);
        }else if (this.mesh.nodes[identity] && this.mesh.nodes[identity][method]) {
            this.server.
        }
    }
}
module.exports = function (opts) {
    return {
        options: opts,
        httpserver: null,
        customServer: false,
        server: null,
        port: 3000,
        setServer: (server, port) => {
            this.httpserver = server;
            this.port = port || this.port;
            this.customServer = true;
        },
        started: null,
        nodes: {},
        node: null,
        start: (identity) => {
            if (!!this.started) throw `Mesh ${this.started} already started`
            if (!this.options[identity]) throw `Mesh ${identity} is not defined in the supplied schema - those available are [${Object.keys(this.options).join(",")}]`
            for (var identityValue in this.options) {
                this.nodes[identityValue] = new socketnode(this, identityValue, this.options)
            }
            this.node = this.nodes[identity];
        },
        send: async (identity, method, data) => {
            return await this.node.send(identity, method, data)
        }
    }
}