// Jest setup file for VSCode extension testing
import * as vscode from 'vscode';

// Mock global objects and functions that might be used in tests
global.console = {
  ...console,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
};

// Set up any global test utilities or configurations here