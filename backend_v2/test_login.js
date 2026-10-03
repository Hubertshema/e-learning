
async function test() {
  const email = `testuser_${Date.now()}@example.com`;
  const registerData = { email, password: 'Password123!', firstName: 'Test', lastName: 'User', role: 'STUDENT' };

  let regRes = await fetch('http://127.0.0.1:5000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerData)
  });
  let regData = await regRes.json();
  const token1 = regData.data.tokens.accessToken;
  console.log('Registered and got Token 1');

  let profileRes = await fetch('http://127.0.0.1:5000/api/v1/student/profile', {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  console.log('Profile with token 1:', profileRes.status);

  const loginData = { email, password: 'Password123!' };
  let res2 = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData)
  });
  let data2 = await res2.json();
  const token2 = data2.data.tokens.accessToken;
  console.log('Token 2 received');

  let profileResAfter = await fetch('http://127.0.0.1:5000/api/v1/student/profile', {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  console.log('Profile with token 1 after second login:', profileResAfter.status);
  
  if (profileResAfter.status === 401) {
    console.log('SUCCESS: Token 1 was invalidated correctly!');
  } else {
    console.log('FAILURE: Token 1 was not invalidated.');
  }

  let profileRes2 = await fetch('http://127.0.0.1:5000/api/v1/student/profile', {
    headers: { 'Authorization': `Bearer ${token2}` }
  });
  console.log('Profile with token 2:', profileRes2.status);
}

test();
