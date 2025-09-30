// Simple test file to check if the Zod resolver type issue is fixed
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { schemaForStep } from './components/form/renderer';

// Mock a question to test schema creation
const mockQuestions = [
  {
    key: 'testField',
    type: 'text',
    required: true
  }
];

// Create schema and check resolver compatibility
const testSchema = schemaForStep(mockQuestions);
// This line should not have type errors if our fix worked
const resolver = zodResolver(testSchema);

console.log('Type test completed successfully!');