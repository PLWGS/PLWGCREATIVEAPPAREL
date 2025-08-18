const axios = require('axios');

async function testCustomOrders() {
  try {
    console.log('Submitting custom order request...');
    const requestData = {
      fullName: 'Test Customer',
      email: 'test.customer@example.com',
      phone: '123-456-7890',
      timeline: 'standard',
      concept: 'A test concept for a custom shirt.',
      styles: ['Gothic', 'Minimalist'],
      productType: 'T-Shirt',
      quantity: '2-5',
      sizes: ['M', 'L'],
      colors: 'Black, White',
      budget: '100-250',
      notes: 'This is a test submission.',
      referenceImages: []
    };

    const response = await axios.post('http://localhost:3000/api/custom-requests', requestData);
    console.log('Custom order submission successful:', response.data);
  } catch (error) {
    console.error('\nCustom order submission failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCustomOrders();
