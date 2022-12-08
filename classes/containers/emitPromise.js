
import { v4 as uuidv4 } from 'uuid'
const promises = {

}
export const emitPromise = ({ timeoutSeconds = 3, socket, command } = { timeoutSeconds: 3 }) => {
  const uid = uuidv4().toString('utf8')
  return {
    uid,
    promise: new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        delete promises[uid]
        // console.log({ timeout: { socket, command } })
        reject(new Error('Request timed out'))
      }, timeoutSeconds * 1000)
      promises[uid] = data => {
        clearTimeout(timeout)
        delete promises[uid]
        resolve(data)
      }
    })
  }
}
export const promiseResponded = (data) => {
  if (data.uid && promises[data.uid]) {
    const uid = data.uid
    delete data.uid
    promises[uid](data)
  }
}

export default emitPromise