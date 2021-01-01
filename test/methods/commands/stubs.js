
import { contextLog } from '@pauliclark/log-context'
const log = contextLog('stub')
const stubs = {
  queued: (socketNode, ...args) => {
    log.log(JSON.stringify({ queued: { ...args } }, null, 2))
  },
  sampleA: (socketNode, ...args) => {
    log.log(JSON.stringify({ sampleA: { ...args } }, null, 2))
  },
  sampleB: (socketNode, ...args) => {
    log.log(JSON.stringify({ sampleB: { ...args } }, null, 2))
  }
}
export default stubs
