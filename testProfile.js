const fetch = require('node-fetch');

async function testProfileEndpoint() {
  try {
    // Login dulu untuk dapat token
    console.log('1. Testing login...');
    const loginResponse = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username_admin: 'iniadminanjay',
        password_admin: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.error('Login failed!');
      return;
    }
    
    const token = loginData.token;
    console.log('\n2. Testing GET /api/admin/profile...');
    
    // Get profile
    const getResponse = await fetch('http://localhost:5000/api/admin/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const profileData = await getResponse.json();
    console.log('Get profile response:', profileData);
    
    // Update profile
    console.log('\n3. Testing PUT /api/admin/profile...');
    const updateResponse = await fetch('http://localhost:5000/api/admin/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nama_admin: 'Admin Utama Updated',
        username_admin: 'iniadminanjay'
      })
    });
    
    const updateData = await updateResponse.json();
    console.log('Update profile response:', updateData);
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProfileEndpoint();
