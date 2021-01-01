import stubs from './stubs.js'
const sampleA = function (data) {
  stubs.sampleA(this, data)
  return { command: 'sampleA' }
}
export default sampleA
