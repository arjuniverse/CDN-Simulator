const { createEdgeServer } = require('./edge-server');

createEdgeServer({
    name: 'US-Edge',
    port: 3003,
    latency: 50,   // 50ms simulated latency (closest to user)
    region: 'US-East (Virginia)'
});
