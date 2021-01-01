import stubs from './stubs.js'
export const sampleB = async function (data) {
  stubs.sampleB(this, data)
  return { command: 'sampleB command response' }
}
// console.log('Importing sampleB')
export default sampleB
