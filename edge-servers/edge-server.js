const express = require('express');

/**
 * Creates an edge server with configurable latency simulation
 * @param {Object} config - Server configuration
 * @param {string} config.name - Server name (e.g., "Asia", "Europe", "US")
 * @param {number} config.port - Port to run on
 * @param {number} config.latency - Simulated network latency in ms
 * @param {string} config.region - Geographic region
 */
function createEdgeServer(config) {
    const app = express();
    const { name, port, latency, region } = config;

    // In-memory cache for content
    const cache = new Map();

    // Simulated content database
    const contentDB = {
        'video1': { type: 'video', size: '1.2GB', data: 'Video content: Introduction to CDN' },
        'video2': { type: 'video', size: '800MB', data: 'Video content: Network Fundamentals' },
        'image1': { type: 'image', size: '2MB', data: 'Image content: CDN Architecture Diagram' },
        'image2': { type: 'image', size: '1.5MB', data: 'Image content: Network Topology' },
        'page1': { type: 'html', size: '50KB', data: '<html><body><h1>Welcome to CDN Demo</h1></body></html>' },
        'api-data': { type: 'json', size: '10KB', data: { message: 'API Response', items: [1, 2, 3, 4, 5] } }
    };

    // Middleware to simulate network latency
    const simulateLatency = (req, res, next) => {
        const actualLatency = latency + Math.random() * 20 - 10; // Add jitter ±10ms
        setTimeout(next, Math.max(0, actualLatency));
    };

    app.use(express.json());
    app.use(simulateLatency);

    // Health check endpoint (used by controller for latency measurement)
    app.get('/health', (req, res) => {
        res.json({
            server: name,
            region: region,
            port: port,
            status: 'healthy',
            cacheSize: cache.size,
            timestamp: Date.now()
        });
    });

    // Get content endpoint
    app.get('/content/:id', (req, res) => {
        const contentId = req.params.id;
        const requestTime = Date.now();

        // Check cache first
        if (cache.has(contentId)) {
            const cachedContent = cache.get(contentId);
            return res.json({
                server: name,
                region: region,
                contentId: contentId,
                content: cachedContent.content,
                cacheHit: true,
                servedAt: requestTime,
                simulatedLatency: latency
            });
        }

        // Fetch from "origin" (simulated content DB)
        const content = contentDB[contentId];
        if (!content) {
            return res.status(404).json({
                server: name,
                region: region,
                error: 'Content not found',
                contentId: contentId
            });
        }

        // Cache the content
        cache.set(contentId, {
            content: content,
            cachedAt: requestTime
        });

        res.json({
            server: name,
            region: region,
            contentId: contentId,
            content: content,
            cacheHit: false,
            servedAt: requestTime,
            simulatedLatency: latency
        });
    });

    // List available content
    app.get('/content', (req, res) => {
        res.json({
            server: name,
            region: region,
            availableContent: Object.keys(contentDB),
            cachedContent: Array.from(cache.keys())
        });
    });

    // Clear cache endpoint
    app.post('/cache/clear', (req, res) => {
        cache.clear();
        res.json({
            server: name,
            message: 'Cache cleared',
            timestamp: Date.now()
        });
    });

    // Cache stats
    app.get('/cache/stats', (req, res) => {
        res.json({
            server: name,
            region: region,
            cacheSize: cache.size,
            cachedItems: Array.from(cache.keys()),
            timestamp: Date.now()
        });
    });

    // Start server
    app.listen(port, () => {
        console.log(`[${name}] Edge Server running on port ${port}`);
        console.log(`[${name}] Region: ${region}, Simulated Latency: ${latency}ms`);
    });

    return app;
}

module.exports = { createEdgeServer };
