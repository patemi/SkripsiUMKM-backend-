const http = require('http');

// Get token first by logging in
const loginData = JSON.stringify({
  username_admin: 'admin',
  password_admin: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

console.log('🔐 Step 1: Login to get token...\n');

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const loginResponse = JSON.parse(data);
      
      if (loginResponse.success && loginResponse.token) {
        console.log('✅ Login successful!');
        console.log('Token:', loginResponse.token.substring(0, 50) + '...\n');
        
        // Now test growth endpoint
        console.log('📊 Step 2: Testing /api/growth endpoint...\n');
        
        const growthOptions = {
          hostname: 'localhost',
          port: 5000,
          path: '/api/growth',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginResponse.token}`
          }
        };
        
        const growthReq = http.request(growthOptions, (growthRes) => {
          let growthData = '';
          
          growthRes.on('data', (chunk) => {
            growthData += chunk;
          });
          
          growthRes.on('end', () => {
            console.log('Status Code:', growthRes.statusCode);
            console.log('Response:\n');
            
            try {
              const parsed = JSON.parse(growthData);
              console.log(JSON.stringify(parsed, null, 2));
              
              if (parsed.success && parsed.data) {
                console.log('\n✅ Growth endpoint is working!');
                console.log(`📈 Found ${parsed.count} data points`);
                console.log('\nData for Chart:');
                parsed.data.forEach((item, index) => {
                  console.log(`  ${index + 1}. ${item.month}: ${item.umkm} UMKM, ${item.users} Users`);
                });
              } else {
                console.log('\n❌ Growth endpoint returned error');
              }
            } catch (error) {
              console.log('Raw response:', growthData);
            }
          });
        });
        
        growthReq.on('error', (error) => {
          console.error('❌ Error testing growth endpoint:', error.message);
        });
        
        growthReq.end();
        
      } else {
        console.log('❌ Login failed:', loginResponse);
      }
    } catch (error) {
      console.error('❌ Error parsing login response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

loginReq.on('error', (error) => {
  console.error('❌ Error during login:', error.message);
  console.log('\n⚠️  Make sure backend is running on http://localhost:5000');
});

loginReq.write(loginData);
loginReq.end();
