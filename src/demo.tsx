import React from 'react';
import ReactDOM from 'react-dom/client';
import { ResultPageDemo } from './components/pages/ResultPageDemo';
import { StrictMode } from 'react';

// This is a temporary entry point for the ResultPageDemo component
// It allows us to showcase and verify our implementation of the different scenarios

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ResultPageDemo />
  </StrictMode>
);