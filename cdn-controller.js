const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Edge server configuration
const edgeServers = [
    { name: 'Asia-Edge', url: 'http://localhost:3001', region: 'Asia-Pacific' },
    { name: 'Europe-Edge', url: 'http://localhost:3002', region: 'Europe' },
    { name: 'US-Edge', url: 'http://localhost:3003', region: 'US-East' }
];

// Track server health and latency
const serverStats = new Map();

// Initialize stats for each server
edgeServers.forEach(server => {
    serverStats.set(server.name, {
        latency: Infinity,
        healthy: false,
        lastCheck: null,
        requestCount: 0
    });
});

/**
 * Measure latency to an edge server
 */
async function measureLatency(server) {
    const start = Date.now();
    try {
        const response = await axios.get(`${server.url}/health`, { timeout: 5000 });
        const latency = Date.now() - start;
        
        serverStats.set(server.name, {
            latency: latency,
            healthy: true,
            lastCheck: Date.now(),
            requestCount: serverStats.get(server.name).requestCount,
            serverInfo: response.data
        });
        
        return { server, latency, healthy: true };
    } catch (error) {
        serverStats.set(server.name, {
            latency: Infinity,
            healthy: false,
            lastCheck: Date.now(),
            requestCount: serverStats.get(server.name).requestCount,
            error: error.message
        });
        
        return { server, latency: Infinity, healthy: false };
    }
}

/**
 * Select the best edge server based on lowest latency
 */
async function selectBestServer() {
    // Measure latency to all servers in parallel
    const results = await Promise.all(edgeServers.map(measureLatency));
    
    // Filter healthy servers and sort by latency
    const healthyServers = results
        .filter(r => r.healthy)
        .sort((a, b) => a.latency - b.latency);
    
    if (healthyServers.length === 0) {
        return null;
    }
    
    return healthyServers[0];
}

/**
 * Forward request to selected edge server
 */
async function forwardRequest(server, endpoint) {
    const start = Date.now();
    try {
        const response = await axios.get(`${server.url}${endpoint}`);
        const responseTime = Date.now() - start;
        
        // Update request count
        const stats = serverStats.get(server.name);
        stats.requestCount++;
        
        return {
            success: true,
            data: response.data,
            responseTime: responseTime,
            selectedServer: server.name
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            selectedServer: server.name
        };
    }
}

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// CDN Controller endpoints

// Get content through CDN (main endpoint)
app.get('/cdn/content/:id', async (req, res) => {
    const contentId = req.params.id;
    const totalStart = Date.now();
    
    console.log(`\n[CDN Controller] Request for content: ${contentId}`);
    
    // Select best server
    const selection = await selectBestServer();
    
    if (!selection) {
        return res.status(503).json({
            error: 'No healthy edge servers available',
            timestamp: Date.now()
        });
    }
    
    console.log(`[CDN Controller] Selected: ${selection.server.name} (latency: ${selection.latency}ms)`);
    
    // Forward request to selected server
    const result = await forwardRequest(selection.server, `/content/${contentId}`);
    const totalTime = Date.now() - totalStart;
    
    if (!result.success) {
        return res.status(500).json({
            error: result.error,
            selectedServer: result.selectedServer
        });
    }
    
    res.json({
        ...result.data,
        cdnMetrics: {
            selectedServer: selection.server.name,
            serverRegion: selection.server.region,
            serverLatency: selection.latency,
            responseTime: result.responseTime,
            totalTime: totalTime,
            timestamp: Date.now()
        }
    });
});

// Get CDN status and all server stats
app.get('/cdn/status', async (req, res) => {
    // Refresh latency measurements
    await Promise.all(edgeServers.map(measureLatency));
    
    const status = edgeServers.map(server => ({
        ...server,
        stats: serverStats.get(server.name)
    }));
    
    res.json({
        controller: 'CDN Controller',
        port: PORT,
        edgeServers: status,
        timestamp: Date.now()
    });
});

// List available content
app.get('/cdn/content', async (req, res) => {
    const selection = await selectBestServer();
    
    if (!selection) {
        return res.status(503).json({ error: 'No healthy edge servers available' });
    }
    
    const result = await forwardRequest(selection.server, '/content');
    res.json(result.data);
});

// Health check for controller
app.get('/health', (req, res) => {
    res.json({
        service: 'CDN Controller',
        status: 'healthy',
        port: PORT,
        timestamp: Date.now()
    });
});

// Periodic health check (every 10 seconds)
setInterval(async () => {
    console.log('\n[CDN Controller] Running periodic health check...');
    const results = await Promise.all(edgeServers.map(measureLatency));
    results.forEach(r => {
        const status = r.healthy ? `✓ ${r.latency}ms` : '✗ offline';
        console.log(`  ${r.server.name}: ${status}`);
    });
}, 10000);

// Start controller
app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('         Mini CDN Simulation - Controller');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`CDN Controller running on http://localhost:${PORT}`);
    console.log(`Frontend available at http://localhost:${PORT}`);
    console.log('\nEdge Servers:');
    edgeServers.forEach(s => console.log(`  - ${s.name}: ${s.url}`));
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Initial health check
    setTimeout(async () => {
        console.log('[CDN Controller] Initial health check...');
        await Promise.all(edgeServers.map(measureLatency));
    }, 1000);
});
