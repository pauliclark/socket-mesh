import { anyNode } from '../../constants/identifiers.js'
import balanced from '../methods/balanced/nodeB.js'
import broadcast from '../methods/broadcast/nodeB.js'
const id = 'nodeB'
const schema = async worker => {
  return {
    _allow: anyNode,
    _connect: ['nodeB'],
    _commands: {
      _balanced: await balanced(worker === id),
      _broadcast: await broadcast(worker === id)
    }
  }
}

export default schema
