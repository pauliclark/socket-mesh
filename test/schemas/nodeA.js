import {anyNode} from '../../constants/identifiers.js'
import balanced from '../methods/balanced/nodeA.js'
import broadcast from '../methods/broadcast/nodeA.js'
const id = 'nodeA'
const schema = async worker => {
  if (worker===id) console.log(`Attach method for ${worker}`)
  const _broadcast = await broadcast(worker===id)
  const schema = {
  _allow:anyNode,
  _connect:['nodeB'],
  _commands: {
    _balanced: await balanced(worker===id),
    _broadcast
  }
}
// console.log(schema._commands._broadcast)
return schema
}

export default schema