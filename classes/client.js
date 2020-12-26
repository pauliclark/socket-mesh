import client from "socket.io-client"
import {setSecret, encrypt, decrypt} from '../helpers/parser.js'
export class Client {
    constructor({log=console,ip,port,worker,variant,identity,schema, privateKey}) {
        
        this.log = log
        this.ip = ip
        this.port = port
        this.worker = worker
        this.variant = variant
        this.identity = identity
        this.schema = schema
        setSecret(privateKey)
        this.connect()
    }
    connect() {
        const address = `http://${this.ip}:${this.port}`
        this.socket = client(address)
// console.log(this.socket)

        // this.socket.onAny((event,...args) => {
        //     this.log.log(event)
        // })
        this.log.log(`${this.identity.worker} connecting to ${address}`)
        this.socket.on("connect",() => {
            this.log.warn(this.identity)
            this.declareMyself()
        })
        this.socket.on('connect_error', (error) => {
            this.log.error(error)
          })
          this.socket.on('reconnect', (attemptNumber) => {
            this.log.info({attemptNumber})
          })
          this.socket.on('connect_timeout', (timeout) => {
            this.log.info({timeout})
          })

    this.socket.on("error", (data) => {
        data = decrypt(data)
        if (data.message) {
          this.log.error(new Error(data.message))
        }else{
            this.log.error(data)
        }
      })
      
      
      this.socket.on("disconnect",() => {
        this.log.log(`${this.identity.worker} disconnecting from ${address}`)
      })
    }
    declareMyself() {
        this.log.log('declareMyself')
    this.socket.on('declared',data => {
        this.declared(decrypt(data))
      })
      this.socket.emit('declare',encrypt(this.identity))
    }
    declared(data) {
        this.log.log(data)
    }

    //    // ((this.schema.local.connect instanceof Array)?this.schema.local.connect:[]).forEach(remote => {
    //         if (!this.schema.server) throw `${server} node is not in the schema`
    //     //})

    //     let url = (
    //         this.schema.server.address.protocol?this.schema.server.address.protocol:'https'
    //         ) + ':\\' + this.schema.server.address.host + (
    //         this.schema.server.address.port ? `:${this.schema.server.address.port}`:'3000'
    //     )
    //     this.client = require('socket.io-client')(url)
    //     this.logger.log(`${this.identity} client has been created to server ${server} ${url}`)

    //     this.client.on('connect', function () {
    //         // connected
    //         this.logger.log(`${this.identity} client has connected to ${server} server`)
    //     }.bind(this))
    //     this.client.on('event', function (data) {
    //         // event
    //         this.logger.log(data)
    //     }.bind(this))
    //     this.client.on('disconnect', function () {
    //         // disconnected
    //         this.logger.log(`${this.identity} client has disconnected from ${server} server`)
    //     }.bind(this))
    //     this.client.on('attached', function () {
    //         // attached
    //         this.logger.log(`${this.identity} client has attached to ${server} server`)
    //         this.client.emit('identify',{identity:this.identity})
    //     }.bind(this))
    //     this.client.on('denied', function () {
    //         // denied
    //         this.logger.log(`${this.identity} client has been denied access to ${server} server`)
    //         this.connected=true;
    //     }.bind(this))
    //     this.client.on('approved', function () {
    //         // approved
    //         this.logger.log(`${this.identity} client has been approved access to ${server} server`)
    //         this.connected=true;
    //     }.bind(this))
    // }
    // async request({command,request}) {
    //     if (!this.schema.server.methods[command]) throw `${command} method is not defined from server ${server}`
    //     const allow=this.schema.server.methods[command].allow;
    //     if (allow!==null || !allow.includes(this.identity)) throw `${command} method is denied for server ${server}`
    //     const callback=!!this.schema.server.methods[command].callback;
    //     if (callback) {
    //         this.logger.log(`${this.identity} client sent ${command} to ${server} server - awaiting a response`)
    //         return await this.promiser.add({
    //             method:function(uuid) {
    //                 this.logger.log(`${this.identity} client received ${command} response from ${server} server`)
    //                 this.client.emit('request',{command,uuid,request})
    //             }.bind(this)
    //         })
    //     }else{
    //         this.logger.log(`${this.identity} client sent ${command} to ${server} server`)
    //         this.client.emit('request',{command,request})
    //     }
    // }
}
export default Client