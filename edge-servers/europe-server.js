const { createEdgeServer } = require('./edge-server');

createEdgeServer({
    name: 'Europe-Edge',
    port: 3002,
    latency: 80,   // 80ms simulated latency
    region: 'Europe (Frankfurt)'
});
