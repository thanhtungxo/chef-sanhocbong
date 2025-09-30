const { ConvexHttpClient } = require('convex/browser');

const client = new ConvexHttpClient('https://zealous-porcupine-776.convex.cloud');

client.query('forms:getActiveForm', {}).then(result => {
  if (result && result.questionsByStep) {
    console.log('Available form questions:');
    Object.entries(result.questionsByStep).forEach(([stepId, questions]) => {
      console.log(`\nStep ${stepId}:`);
      questions.forEach(q => {
        console.log(`  - Key: ${q.key}, Label: ${q.ui?.labelText || q.labelKey}, Type: ${q.type}`);
      });
    });
  } else {
    console.log('No active form found');
  }
}).catch(err => console.error('Error:', err));