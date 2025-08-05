const fs = require('fs');

async function testModuleAPI() {
  try {
    // Read the test token
    const token = fs.readFileSync('temp_token.txt', 'utf8').trim();
    
    const response = await fetch('http://localhost:3000/api/generate-module-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        moduleId: 'test-module-001',
        learningStyle: 'visual',
        targetLevel: 'beginner',
        topic: 'JavaScript Basics',
        description: 'Introduction to JavaScript programming'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Full response:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('Error response:', error);
    }
  } catch (error) {
    console.error('Network error:', error.message);
  }
}

testModuleAPI();
