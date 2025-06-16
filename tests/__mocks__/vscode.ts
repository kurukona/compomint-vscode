// Mock VSCode API for testing
export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
    has: jest.fn(),
    inspect: jest.fn(),
    update: jest.fn()
  })),
  findFiles: jest.fn(),
  openTextDocument: jest.fn(),
  onDidChangeConfiguration: jest.fn(),
  onDidSaveTextDocument: jest.fn(),
  workspaceFolders: []
};

export const window = {
  createTextEditorDecorationType: jest.fn(() => ({
    dispose: jest.fn()
  })),
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  createTreeView: jest.fn(),
  createWebviewPanel: jest.fn(() => ({
    webview: {
      html: '',
      postMessage: jest.fn(),
      onDidReceiveMessage: jest.fn()
    },
    dispose: jest.fn(),
    reveal: jest.fn()
  })),
  onDidChangeActiveTextEditor: jest.fn(),
  activeTextEditor: undefined
};

export const languages = {
  createDiagnosticCollection: jest.fn(() => ({
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    dispose: jest.fn()
  }))
};

export const commands = {
  registerCommand: jest.fn(),
  executeCommand: jest.fn()
};

export const Uri = {
  file: jest.fn((path: string) => ({ fsPath: path, path })),
  parse: jest.fn()
};

export const Range = jest.fn();
export const Position = jest.fn();
export const Location = jest.fn();
export const Diagnostic = jest.fn();
export const DiagnosticSeverity = {
  Error: 0,
  Warning: 1,
  Information: 2,
  Hint: 3
};

export const TreeItem = jest.fn();
export const TreeItemCollapsibleState = {
  None: 0,
  Collapsed: 1,
  Expanded: 2
};

export const OverviewRulerLane = {
  Left: 1,
  Center: 2,
  Right: 4,
  Full: 7
};

export const ViewColumn = {
  Active: -1,
  Beside: -2,
  One: 1,
  Two: 2,
  Three: 3
};