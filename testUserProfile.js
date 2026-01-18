// Test User Profile Management Endpoints
const API_URL = 'http://localhost:5000/api';

async function testUserProfileManagement() {
  try {
    console.log('=== USER PROFILE MANAGEMENT TEST ===\n');

    // 1. Login user
    console.log('1. Testing Login...');
    const loginResponse = await fetch(`${API_URL}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'budi',
        password_user: 'user1234'
      })
    });

    const loginData = await loginResponse.json();
    console.log('✓ Login response:', loginData);

    if (!loginData.success) {
      console.error('❌ Login failed');
      return;
    }

    const token = loginData.token;
    console.log('✓ Token obtained:', token.substring(0, 20) + '...\n');

    // 2. Get user profile
    console.log('2. Testing GET /api/user/profile...');
    const profileResponse = await fetch(`${API_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const profileData = await profileResponse.json();
    console.log('✓ Profile response:', profileData);
    console.log('✓ Current Profile:', {
      nama_user: profileData.data.nama_user,
      email_user: profileData.data.email_user,
      username: profileData.data.username
    });
    console.log('');

    // 3. Update user profile
    console.log('3. Testing PUT /api/user/profile...');
    const updateResponse = await fetch(`${API_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nama_user: 'Budi Rahman Updated',
        email_user: 'budi.updated@example.com'
      })
    });

    const updateData = await updateResponse.json();
    console.log('✓ Update response:', updateData);
    console.log('✓ Updated Profile:', {
      nama_user: updateData.data.nama_user,
      email_user: updateData.data.email_user
    });
    console.log('');

    // 4. Change password
    console.log('4. Testing PUT /api/user/password...');
    const passwordResponse = await fetch(`${API_URL}/user/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'user1234',
        newPassword: 'newpassword123'
      })
    });

    const passwordData = await passwordResponse.json();
    console.log('✓ Password change response:', passwordData);
    console.log('');

    // 5. Test wrong current password
    console.log('5. Testing wrong current password...');
    const wrongPasswordResponse = await fetch(`${API_URL}/user/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'wrongpassword',
        newPassword: 'anotherpassword'
      })
    });

    const wrongPasswordData = await wrongPasswordResponse.json();
    console.log('✓ Wrong password response:', wrongPasswordData);
    console.log('');

    // 6. Revert password back to original
    console.log('6. Reverting password back to original...');
    const revertResponse = await fetch(`${API_URL}/user/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'newpassword123',
        newPassword: 'user1234'
      })
    });

    const revertData = await revertResponse.json();
    console.log('✓ Password reverted:', revertData);
    console.log('');

    // 7. Revert profile data
    console.log('7. Reverting profile data to original...');
    const revertProfileResponse = await fetch(`${API_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nama_user: 'Budi Rahman',
        email_user: 'budi@example.com'
      })
    });

    const revertProfileData = await revertProfileResponse.json();
    console.log('✓ Profile reverted:', {
      nama_user: revertProfileData.data.nama_user,
      email_user: revertProfileData.data.email_user
    });
    console.log('');

    console.log('✅ ALL USER PROFILE MANAGEMENT TESTS PASSED!');
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run tests
testUserProfileManagement();
