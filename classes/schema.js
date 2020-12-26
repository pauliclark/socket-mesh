import {anyNode} from '../constants/identifiers.js'
export default class Schema{
  constructor(schema) {
    this.schema = schema
  }
  validWorker(worker) {
    return !!this.schema[worker]
  }
  allow(from, to) {
    if (!this.validWorker(from)) throw new Error(`${from} is not a valid worker`)
    if (!this.validWorker(to)) throw new Error(`${to} is not a valid worker`)
    const isConnect = (this.schema[from]._connect &&
      (this.schema[from]._connect === anyNode ||
        this.schema[from]._connect.includes(to)
    ))
    const isAllow = (this.schema[to]._allow &&
      (this.schema[to]._allow === anyNode ||
        this.schema[to]._allow.includes(from)
    ))
    // console.log({from, to, isConnect, isAllow})
    return isConnect && isAllow
  }
}