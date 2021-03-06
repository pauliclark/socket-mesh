
import socketMethods from '../common/socketMethods.js'
class InboundClient {
  constructor ({
    methods,
    localWorker,
    worker,
    variant,
    connection,
    connections,
    schema,
    log = console
  }) {
    this.remoteWorker = worker
    this.variant = variant
    this.methods = methods
    this.connection = connection
    this.connections = connections
    this.commands = schema.getCommands(localWorker)
    this.log = log
    const { commandResponse, command } = socketMethods(connection, methods, this.commands, { log: this.log, connections: this.connections })
    this.commandResponse = commandResponse
    this.command = command
  }
}
export default InboundClient
