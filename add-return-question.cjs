const { ConvexHttpClient } = require('convex/browser');

const client = new ConvexHttpClient('https://zealous-porcupine-776.convex.cloud');

async function addReturnQuestion() {
  try {
    // Get active form
    const activeForm = await client.query('forms:getActiveForm', {});
    if (!activeForm) {
      console.log('No active form found');
      return;
    }

    console.log('Active form:', activeForm.formSet.name);
    
    // Find the last step (usually where final questions go)
    const steps = activeForm.steps.sort((a, b) => a.order - b.order);
    const lastStep = steps[steps.length - 1];
    
    console.log('Adding question to step:', lastStep.titleKey);

    // Add the returnToHomeCountry question
    const result = await client.mutation('forms:createQuestion', {
      formSetId: activeForm.formSet._id,
      stepId: lastStep._id,
      key: 'planToReturn',
      labelKey: 'ui.planToReturn.label',
      type: 'radio',
      required: true,
      options: [
        { value: 'true', labelText: 'Có, tôi cam kết trở về Việt Nam sau khi hoàn thành khóa học' },
        { value: 'false', labelText: 'Không, tôi có kế hoạch ở lại nước ngoài' }
      ],
      ui: {
        labelText: 'Bạn có cam kết trở về Việt Nam sau khi hoàn thành khóa học không?'
      }
    });

    console.log('Question added successfully:', result);
  } catch (error) {
    console.error('Error adding question:', error);
  }
}

addReturnQuestion();