const {remote} = require('./wrappers/remote.js')
const {attachedClient} = require('./wrappers/attachedClient.js')
const io = require("socket.io");
class server {
    constructor({identity,schema,promiser,logger,httpserver}) {
        //console.log(identity,schema[identity])
        this.httpserver=httpserver || require('http').createServer()
        this.promiser=promiser;
        this.logger=logger;
        this.identity=identity;
        this.schema={
            local:schema[identity],
            remotes:{}
        };
        //this.logger.log(`${this.identity} server is being created`);
        //console.log(this.schema.local.allow)
        // define the available remote connections
        ((this.schema.local.allow instanceof Array)?this.schema.local.allow:Object.keys(schema)).forEach(function(remoteIdentity) {
            this.logger.log(`Defining ${remoteIdentity} remote`)
            if (!schema[remoteIdentity]) throw `${remoteIdentity} node is not in the schema`
            if (remoteIdentity!==identity) this.schema.remotes[remoteIdentity]=new remote({
                identity,
                schema:schema[remoteIdentity],
                promiser
            });
        }.bind(this))
        this.logger.log(`${this.identity} server has been created`);
        this.start();
    }
    start() {
        this.server = io(this.httpserver);
        this.server.on('connection', client => {
            new attachedClient({
                client,
                server:this,
                promiser:this.promiser
            })
        });
        if (!!this.httpserver) {
            this.httpserver.listen((this.schema.local.address && this.schema.local.address.port) || 3000);
            this.logger.log(`${this.identity} server listening on port ${(this.schema.local.address && this.schema.local.address.port) || 3000}`);
        }else{
            this.logger.error(`${this.identity} server does not have an httpserver`)
        }
    }
    canConnect(identity) {
        return (this.schema.local.allow===null || (this.schema.local.allow instanceof Array && this.schema.local.allow.includes(client.identity)))
    }
    async method({client,command,request}) {
        if (this.schema.local.allow===null || (this.schema.local.allow instanceof Array && this.schema.local.allow.includes(client.identity))) {
            if (this.schema.local.methods && this.schema.local.methods[command]) {
                const method = this.schema.local.methods[command];
                if (method.allow===null || (method.allow instanceof Array && method.allow.includes(client.identity))) {
                    if (!!method.callback) {
                        return await method.method(request);
                    }else{
                        method.method(request);
                    }
                }else{
                    return {error:`${client.identity} client does not access to method ${command} on this $(this.identity} server`}
                }
            }else{
                return {error:`Method ${command} is not defined on this $(this.identity} server`}
            }
        }else{
            return {error:`${client.identity} client does not access to this $(this.identity} server`}
        }
    }
    received({payload}) {
        this.promiser.received({payload}) || this.method({payload})
    }
    send({identity,method,payload}) {
        // if (this.schema.remotes[identity]) 
    }
}
module.exports = {server}