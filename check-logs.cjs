const { ConvexHttpClient } = require('convex/browser');

const client = new ConvexHttpClient('https://zealous-porcupine-776.convex.cloud');

async function checkRecentSubmissions() {
  try {
    console.log('Checking recent form submissions...');
    
    // Try to get recent submissions if there's a submissions table
    try {
      const submissions = await client.query('submissions:list', {});
      console.log('Recent submissions:', JSON.stringify(submissions, null, 2));
    } catch (e) {
      console.log('No submissions table or error accessing it:', e.message);
    }
    
    // Check scholarships status
    try {
      const scholarships = await client.query('scholarships:list', {});
      console.log('\nActive scholarships:');
      scholarships.forEach(s => {
        console.log(`- ${s.name} (${s.id}): ${s.isEnabled ? 'ENABLED' : 'DISABLED'}`);
      });
    } catch (e) {
      console.log('Error getting scholarships:', e.message);
    }
    
    // Test evaluation with minimal data
    console.log('\nTesting evaluation with minimal data...');
    try {
      const testData = {
        citizenship: "citizenshipyes",
        residency: "residencyyes", 
        australiaPrOrCitizen: "australiaPrNo",
        spousepr: "spouseprno",
        military: "militaryno",
        banATungCoTienAnTienSuChua: "criminalno",
        govscholarship: "govescholarno",
        workingtime: 36,
        ieltsgrade: 7.5,
        employmenttype: "vn_company",
        gpa: 7.5,
        ielts: 7.5,
        workExperience: 3,
        hasLeadershipPotential: true,
        planToReturn: true
      };
      
      const result = await client.query('formEvaluation:evaluateFormResponses', {
        responses: testData
      });
      
      console.log('Evaluation result:', JSON.stringify(result, null, 2));
      
    } catch (e) {
      console.log('Error in evaluation:', e.message);
    }

  } catch (error) {
    console.error('Error checking submissions:', error);
  }
}

checkRecentSubmissions();