const http = require('http');

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const start = process.hrtime.bigint();
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const clientElapsed = Number(process.hrtime.bigint() - start) / 1e6;
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers, clientElapsed });
        } catch(e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers, clientElapsed });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- 1. Login to get token ---');
  const login = await post('/login', { email: '24cs048@charusat.edu.in', password: 'password123' });
  const token = login.data.token;
  console.log('Login status:', login.status, 'User:', login.data.user.email);

  console.log('\n--- 2. Measuring UNCACHED Reads (Cache Misses) ---');
  const uncachedReadings = [];
  for (let i = 1; i <= 3; i++) {
    await post('/tasks/cache-flush', {});
    const res = await get('/tasks', token);
    uncachedReadings.push({
      run: i,
      serverTime: res.data.responseTimeMs,
      clientTime: parseFloat(res.clientElapsed.toFixed(2)),
      header: res.headers['x-cache'],
      status: res.data.cacheStatus
    });
    console.log(`Uncached Sample #${i}: Server = ${res.data.responseTimeMs} ms | Client = ${res.clientElapsed.toFixed(2)} ms | X-Cache = ${res.headers['x-cache']}`);
  }

  console.log('\n--- 3. Measuring CACHED Reads (node-cache Hits) ---');
  // First request sets the cache
  await get('/tasks', token);
  const cachedReadings = [];
  for (let i = 1; i <= 3; i++) {
    const res = await get('/tasks', token);
    cachedReadings.push({
      run: i,
      serverTime: res.data.responseTimeMs,
      clientTime: parseFloat(res.clientElapsed.toFixed(2)),
      header: res.headers['x-cache'],
      status: res.data.cacheStatus
    });
    console.log(`Cached Sample #${i}: Server = ${res.data.responseTimeMs} ms | Client = ${res.clientElapsed.toFixed(2)} ms | X-Cache = ${res.headers['x-cache']}`);
  }

  console.log('\n--- 4. Cache Statistics (Supplementary 2) ---');
  const statsRes = await get('/tasks/cache-stats');
  console.log('Cache Stats Response:', JSON.stringify(statsRes.data.stats, null, 2));

  console.log('\n--- 5. Testing Cache Invalidation on Write (POST /tasks) ---');
  const preInvalidationKeys = statsRes.data.stats.activeKeysCount;
  console.log(`Active keys before write: ${preInvalidationKeys}`);
  const createRes = await post('/tasks', {
    title: 'Cache Invalidation Verification Task',
    priority: 'high',
    category: 'Prac9'
  }, token);
  console.log('Task creation status:', createRes.status, createRes.data.message);

  const statsAfter = await get('/tasks/cache-stats');
  console.log(`Active keys after write: ${statsAfter.data.stats.activeKeysCount} (Invalidations: ${statsAfter.data.stats.invalidations})`);

  console.log('\n--- 6. Verifying next GET is a Cache MISS ---');
  const freshRead = await get('/tasks', token);
  console.log(`Fresh Read after write: X-Cache = ${freshRead.headers['x-cache']} | Status = ${freshRead.data.cacheStatus}`);
}

run().catch(console.error);
