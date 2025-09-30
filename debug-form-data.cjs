const { ConvexHttpClient } = require('convex/browser');

const client = new ConvexHttpClient('https://zealous-porcupine-776.convex.cloud');

async function testFormSubmission() {
  try {
    // Test with realistic form data that should pass
    const testFormData = {
      fullName: "Nguyen Van A",
      email: "test@example.com",
      dateOfBirth: "1995-01-01",
      gender: "male",
      countryOfCitizenship: "Vietnam",
      currentCity: "Ho Chi Minh City",
      highestQualification: "bachelor",
      yearsOfExperience: 3,
      currentJobTitle: "Software Engineer",
      employerName: "Tech Company",
      isEmployerVietnameseOwned: true,
      employmentSector: "Technology",
      hasWorkedInMilitaryPolice: false,
      planToReturn: true,
      hasStudiedAbroadOnGovScholarship: false,
      englishTestType: "IELTS",
      englishScore: 7.5,
      
      // Additional fields that might be needed for AAS
      citizenship: "citizenshipyes",
      residency: "residencyyes", 
      australiaPrOrCitizen: "australiaPrNo",
      spousepr: "spouseprno",
      military: "militaryno",
      banATungCoTienAnTienSuChua: "criminalno",
      govscholarship: "govescholarno",
      workingtime: 36, // 3 years = 36 months
      ieltsgrade: 7.5,
      employmenttype: "vn_company",
      gpa: 7.5,
      
      // Chevening fields
      ielts: 7.5,
      workExperience: 3,
      hasLeadershipPotential: true
    };

    console.log('Testing form submission with realistic data...');
    console.log('Form data:', JSON.stringify(testFormData, null, 2));

    const result = await client.mutation('formEvaluation:submitAndEvaluateForm', {
      fullName: testFormData.fullName,
      email: testFormData.email,
      responses: testFormData
    });

    console.log('\nSubmission result:', JSON.stringify(result, null, 2));
    
    if (result.messageType === 'fail_all') {
      console.log('\n❌ Still getting "Rất tiếc..." - All scholarships failed');
    } else {
      console.log('\n✅ Success! At least one scholarship passed');
    }

  } catch (error) {
    console.error('Error testing form submission:', error);
  }
}

testFormSubmission();