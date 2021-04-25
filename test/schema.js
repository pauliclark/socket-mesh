import nodeA from './schemas/nodeA.js'
import nodeB from './schemas/nodeB.js'
const schema = async worker => {
  return {
    nodeA: await nodeA(worker),
    nodeB: await nodeB(worker)
  }
}

export default schema
