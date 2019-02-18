const {nodeA} = require('./nodes/nodeA.js')
const {nodeB} = require('./nodes/nodeB.js')
const {nodeC} = require('./nodes/nodeC.js')
module.exports = {
    schema:{
        nodeA,
        nodeB,
        nodeC
    }
}