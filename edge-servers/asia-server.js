const { createEdgeServer } = require('./edge-server');

createEdgeServer({
    name: 'Asia-Edge',
    port: 3001,
    latency: 150,  // 150ms simulated latency
    region: 'Asia-Pacific (Singapore)'
});
