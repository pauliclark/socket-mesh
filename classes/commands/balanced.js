class Balanced {
  constructor ({ worker, command, responds, socketNode, log = console }) {
    this.worker = worker
    this.command = command
    this.responds = responds || false
    this.socketNode = socketNode
    this.log = log
    this.workerCallHistory = []
    // console.log({ worker, command })
  }

  call (data = {}) {
    if (this.responds) return this.callPromise(data)
    const connections = this.socketNode.connections.connected(this.worker)
    if (connections.length === 1) {
      // if only one worker connected
      const connection = connections.shift()
      connection.command(this.command, data)
      this.workerCallHistory.push(connection.variant)
    } else if (connections.length > 1) {
      const notCalled = connections.filter(connection => !this.workerCallHistory.includes(connection.variant))
      // if workers have not yet been called
      if (notCalled.length) {
        const connection = notCalled.shift()
        connection.command(this.command, data)
        this.workerCallHistory.push(connection.variant)
      } else {
        // call the worker called first on history
        let oldest = []
        while (oldest.length === 0 && this.workerCallHistory.length) {
          const oldestWorker = this.workerCallHistory.shift()
          oldest = connections.filter(connection => connection.variant === oldestWorker)
          // if no longer connected, then try another
        }
        if (oldest.length) {
          const connection = oldest.shift()
          connection.command(this.command, data)
          this.workerCallHistory.push(connection.variant)
        }
      }
    } else {
      this.log.warn(`No ${this.worker} workers currently connected`)
    }
    while (this.workerCallHistory.length > connections.length) {
      this.workerCallHistory.shift()
    }
  }

  callPromise (data = {}) {
    const connections = this.socketNode.connections.connected(this.worker)
    let toReturn = null
    if (connections.length === 1) {
      // if only one worker connected
      const connection = connections.shift()
      toReturn = connection.commandResponse(this.command, data)
      this.workerCallHistory.push(connection.worker)
    } else if (connections.length > 1) {
      const notCalled = connections.filter(connection => !this.workerCallHistory.includes(connection.worker))
      // if workers have not yet been called
      if (notCalled.length) {
        const connection = notCalled.shift()
        toReturn = connection.commandResponse(this.command, data)
        this.workerCallHistory.push(connection.worker)
      } else {
        // call the worker called first on history
        let oldest = []
        while (oldest.length === 0 && this.workerCallHistory.length) {
          const oldestWorker = this.workerCallHistory.shift()
          oldest = connections.filter(connection => connection.worker === oldestWorker)
          // if no longer connected, then try another
        }
        if (oldest.length) {
          const connection = oldest.shift()
          toReturn = connection.commandResponse(this.command, data)
          this.workerCallHistory.push(connection.worker)
        }
      }
    } else {
      this.log.warn(`No ${this.worker} workers currently connected`)
    }
    while (this.workerCallHistory.length > connections.length) {
      this.workerCallHistory.shift()
    }
    return toReturn
  }
}
export default Balanced
