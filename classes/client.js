class client {
    constructor({logger,identity,server,schema,promiser}) {
        this.promiser=promiser;
        this.logger=logger;
        this.identity=identity;
        this.connected=false;
        this.schema={
            server:(server!=identity)?schema[server]:null,
            local:schema[identity]
        };
       // ((this.schema.local.connect instanceof Array)?this.schema.local.connect:[]).forEach(remote => {
            if (!this.schema.server) throw `${server} node is not in the schema`
        //})

        let url = (
            this.schema.server.address.protocol?this.schema.server.address.protocol:'https'
            ) + ':\\' + this.schema.server.address.host + (
            this.schema.server.address.port ? `:${this.schema.server.address.port}`:'3000'
        )
        this.client = require('socket.io-client')(url)
        this.logger.log(`${this.identity} client has been created to server ${server} ${url}`)

        this.client.on('connect', function () {
            // connected
            this.logger.log(`${this.identity} client has connected to ${server} server`)
        }.bind(this))
        this.client.on('event', function (data) {
            // event
            this.logger.log(data)
        }.bind(this))
        this.client.on('disconnect', function () {
            // disconnected
            this.logger.log(`${this.identity} client has disconnected from ${server} server`)
        }.bind(this))
        this.client.on('attached', function () {
            // attached
            this.logger.log(`${this.identity} client has attached to ${server} server`)
            this.client.emit('identify',{identity:this.identity})
        }.bind(this))
        this.client.on('denied', function () {
            // denied
            this.logger.log(`${this.identity} client has been denied access to ${server} server`)
            this.connected=true;
        }.bind(this))
        this.client.on('approved', function () {
            // approved
            this.logger.log(`${this.identity} client has been approved access to ${server} server`)
            this.connected=true;
        }.bind(this))
    }
    async request({command,request}) {
        if (!this.schema.server.methods[command]) throw `${command} method is not defined from server ${server}`
        const allow=this.schema.server.methods[command].allow;
        if (allow!==null || !allow.includes(this.identity)) throw `${command} method is denied for server ${server}`
        const callback=!!this.schema.server.methods[command].callback;
        if (callback) {
            this.logger.log(`${this.identity} client sent ${command} to ${server} server - awaiting a response`)
            return await this.promiser.add({
                method:function(uuid) {
                    this.logger.log(`${this.identity} client received ${command} response from ${server} server`)
                    this.client.emit('request',{command,uuid,request})
                }.bind(this)
            })
        }else{
            this.logger.log(`${this.identity} client sent ${command} to ${server} server`)
            this.client.emit('request',{command,request})
        }
    }
}
module.exports = {client}