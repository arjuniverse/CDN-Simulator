const axios = require('axios');

const CDN_CONTROLLER = 'http://localhost:3000';

// Available content IDs
const CONTENT_IDS = ['video1', 'video2', 'image1', 'image2', 'page1', 'api-data'];

/**
 * Fetch content through the CDN
 */
async function fetchContent(contentId) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📤 Requesting: ${contentId}`);
    console.log(`${'─'.repeat(60)}`);

    const startTime = Date.now();
    
    try {
        const response = await axios.get(`${CDN_CONTROLLER}/cdn/content/${contentId}`);
        const totalTime = Date.now() - startTime;
        const data = response.data;

        console.log(`\n✅ Response received in ${totalTime}ms`);
        console.log(`\n📊 CDN Metrics:`);
        console.log(`   Server:        ${data.cdnMetrics.selectedServer}`);
        console.log(`   Region:        ${data.cdnMetrics.serverRegion}`);
        console.log(`   Server Latency: ${data.cdnMetrics.serverLatency}ms`);
        console.log(`   Response Time:  ${data.cdnMetrics.responseTime}ms`);
        console.log(`   Total Time:     ${data.cdnMetrics.totalTime}ms`);
        console.log(`   Cache Hit:      ${data.cacheHit ? 'Yes ✓' : 'No (fetched from origin)'}`);
        
        console.log(`\n📦 Content:`);
        console.log(`   ID:   ${data.contentId}`);
        console.log(`   Type: ${data.content.type}`);
        console.log(`   Size: ${data.content.size}`);
        console.log(`   Data: ${typeof data.content.data === 'object' 
            ? JSON.stringify(data.content.data) 
            : data.content.data.substring(0, 50) + '...'}`);

        return data;
    } catch (error) {
        console.log(`\n❌ Error: ${error.message}`);
        return null;
    }
}

/**
 * Get CDN status
 */
async function getCDNStatus() {
    console.log('\n' + '═'.repeat(60));
    console.log('           CDN STATUS');
    console.log('═'.repeat(60));

    try {
        const response = await axios.get(`${CDN_CONTROLLER}/cdn/status`);
        const data = response.data;

        console.log(`\n🌐 Controller: ${data.controller} (Port ${data.port})`);
        console.log(`\n🖥️  Edge Servers:`);

        data.edgeServers.forEach(server => {
            const status = server.stats.healthy ? '✅ Online' : '❌ Offline';
            const latency = server.stats.latency === Infinity ? 'N/A' : `${server.stats.latency}ms`;
            console.log(`\n   ${server.name}`);
            console.log(`   ├─ Region:   ${server.region}`);
            console.log(`   ├─ URL:      ${server.url}`);
            console.log(`   ├─ Status:   ${status}`);
            console.log(`   ├─ Latency:  ${latency}`);
            console.log(`   └─ Requests: ${server.stats.requestCount}`);
        });

        return data;
    } catch (error) {
        console.log(`\n❌ Error connecting to CDN Controller: ${error.message}`);
        console.log('   Make sure the controller and edge servers are running.');
        return null;
    }
}

/**
 * Run multiple requests to demonstrate load balancing
 */
async function runLoadTest(numRequests = 5) {
    console.log('\n' + '═'.repeat(60));
    console.log(`         LOAD TEST (${numRequests} requests)`);
    console.log('═'.repeat(60));

    const results = [];

    for (let i = 0; i < numRequests; i++) {
        const contentId = CONTENT_IDS[i % CONTENT_IDS.length];
        const result = await fetchContent(contentId);
        if (result) {
            results.push({
                contentId,
                server: result.cdnMetrics.selectedServer,
                latency: result.cdnMetrics.totalTime,
                cacheHit: result.cacheHit
            });
        }
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('         LOAD TEST SUMMARY');
    console.log('═'.repeat(60));

    const serverCounts = {};
    let totalLatency = 0;
    let cacheHits = 0;

    results.forEach(r => {
        serverCounts[r.server] = (serverCounts[r.server] || 0) + 1;
        totalLatency += r.latency;
        if (r.cacheHit) cacheHits++;
    });

    console.log(`\n📊 Statistics:`);
    console.log(`   Total Requests:   ${results.length}`);
    console.log(`   Average Latency:  ${Math.round(totalLatency / results.length)}ms`);
    console.log(`   Cache Hit Rate:   ${Math.round((cacheHits / results.length) * 100)}%`);
    
    console.log(`\n🖥️  Server Distribution:`);
    Object.entries(serverCounts).forEach(([server, count]) => {
        const percentage = Math.round((count / results.length) * 100);
        console.log(`   ${server}: ${count} requests (${percentage}%)`);
    });
}

/**
 * Interactive demo
 */
async function runDemo() {
    console.log('\n' + '═'.repeat(60));
    console.log('     MINI CDN SIMULATION - CLIENT DEMO');
    console.log('═'.repeat(60));
    console.log('\nThis demo will:');
    console.log('  1. Check CDN status');
    console.log('  2. Fetch content through the CDN');
    console.log('  3. Show which edge server handled the request');
    console.log('  4. Display latency and caching information');

    // Step 1: Get CDN Status
    console.log('\n\n📡 Step 1: Checking CDN Status...');
    await getCDNStatus();

    // Step 2: Fetch some content
    console.log('\n\n📥 Step 2: Fetching content through CDN...');
    
    // First request (cache miss expected)
    console.log('\n--- First request for video1 (expect cache miss) ---');
    await fetchContent('video1');

    // Second request (cache hit expected)
    console.log('\n--- Second request for video1 (expect cache hit) ---');
    await fetchContent('video1');

    // Different content
    console.log('\n--- Request for different content ---');
    await fetchContent('api-data');

    // Step 3: Run load test
    console.log('\n\n🔄 Step 3: Running load test...');
    await runLoadTest(6);

    console.log('\n\n' + '═'.repeat(60));
    console.log('         DEMO COMPLETE');
    console.log('═'.repeat(60));
    console.log('\n💡 Tips:');
    console.log('   - Open http://localhost:3000 for the web interface');
    console.log('   - Try stopping an edge server to see failover');
    console.log('   - Modify edge server latencies in edge-servers/*.js');
    console.log('\n');
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'status':
        getCDNStatus();
        break;
    case 'fetch':
        const contentId = args[1] || 'video1';
        fetchContent(contentId);
        break;
    case 'load':
        const numRequests = parseInt(args[1]) || 5;
        runLoadTest(numRequests);
        break;
    case 'demo':
    default:
        runDemo();
        break;
}
