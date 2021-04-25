import { anyNode } from '../../constants/identifiers.js'
import balanced from '../methods/balanced/nodeA.js'
import broadcast from '../methods/broadcast/nodeA.js'
const id = 'nodeA'
const schema = async worker => {
  const _broadcast = await broadcast(worker === id)
  const schema = {
    _allow: anyNode,
    _connect: ['nodeB'],
    _commands: {
      _balanced: await balanced(worker === id),
      _broadcast
    }
  }
  return schema
}

export default schema
