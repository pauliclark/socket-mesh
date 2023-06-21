
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
    this.worker = worker
    this.localWorker = localWorker
    this.variant = variant
    this.methods = methods
    this.connection = connection
    this.connections = connections
    this.commands = schema.getCommands(localWorker)
    this.log = log
    connection.clientWrapper = this
    const { commandResponse, command } = socketMethods(connection, methods, this.commands, { log: this.log, connections: this.connections })
    this.commandResponse = commandResponse
    this.command = command
  }
}
export default InboundClient
