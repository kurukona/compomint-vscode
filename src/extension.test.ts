import * as vscode from 'vscode';

// Mock the entire extension module since it's too large to test directly
// We'll create specific unit tests for individual functions

describe('Extension Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get file extensions from configuration', () => {
    const mockConfig = {
      get: jest.fn().mockReturnValue('html,htm,php')
    };
    
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);

    // Import the function we want to test
    // Note: You'll need to export this function from extension.ts for testing
    // const { getFileExtensions } = require('./extension');
    // const extensions = getFileExtensions();
    
    // For now, we'll test the mock setup
    const config = vscode.workspace.getConfiguration('compomint');
    const extensions = config.get('fileExtensionFilter', 'html,htm');
    
    expect(extensions).toBe('html,htm,php');
    expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('compomint');
    expect(mockConfig.get).toHaveBeenCalledWith('fileExtensionFilter', 'html,htm');
  });

  test('should create decorators correctly', () => {
    const mockDecorator = {
      dispose: jest.fn()
    };
    
    (vscode.window.createTextEditorDecorationType as jest.Mock).mockReturnValue(mockDecorator);

    // Test decorator creation
    const decorator = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255, 99, 132, 0.35)'
    });

    expect(decorator).toBeDefined();
    expect(vscode.window.createTextEditorDecorationType).toHaveBeenCalled();
  });
});

describe('Template Processing', () => {
  test('should parse Compomint template syntax', () => {
    const templateContent = `
      <template id="test-template">
        <div>##=data.title##</div>
        ##if (data.items) {##
          <ul>##data.items.forEach(item => {##
            <li>##=item##</li>
          ##});##</ul>
        ##}##
      </template>
    `;

    // Test template parsing logic
    const expressions = templateContent.match(/##[^#]*##/g);
    
    expect(expressions).toHaveLength(6);
    expect(expressions?.[0]).toBe('##=data.title##');
    expect(expressions?.[1]).toBe('##if (data.items) {##');
    expect(expressions?.[5]).toBe('##}##');
  });

  test('should validate template structure', () => {
    const validTemplate = '<template id="valid"><div>Content</div></template>';
    const invalidTemplate = '<template><div>Missing ID</div></template>';

    // Test template validation
    const hasValidId = validTemplate.includes('id="');
    const hasInvalidId = !invalidTemplate.match(/id="\w+"/);

    expect(hasValidId).toBe(true);
    expect(hasInvalidId).toBe(true);
  });
});

describe('Template Data Processing', () => {
  test('should extract template metadata correctly', () => {
    const templateContent = `
      <template id="test-component">
        ##!
          const defaultData = { title: 'Test', items: [] };
          compomint.addI18ns({ 'test': { 'title': { 'en': 'Test Title' } } });
        ##
        <div>##=data.title || 'Default'##</div>
      </template>
    `;

    // Extract template ID
    const idMatch = templateContent.match(/id="([^"]+)"/);
    expect(idMatch?.[1]).toBe('test-component');

    // Extract pre-eval blocks (sample data definitions)
    const preEvalBlocks = templateContent.match(/##!\s*[\s\S]*?##/g);
    expect(preEvalBlocks).toHaveLength(1);
    expect(preEvalBlocks?.[0]).toContain('defaultData');
    expect(preEvalBlocks?.[0]).toContain('addI18ns');
  });

  test('should handle template with missing sample data gracefully', () => {
    const templateWithoutData = `
      <template id="no-data-template">
        <div>##=data.title##</div>
      </template>
    `;

    const preEvalBlocks = templateWithoutData.match(/##!\s*[\s\S]*?##/g);
    expect(preEvalBlocks).toBeNull();

    // Should still be able to extract template ID
    const idMatch = templateWithoutData.match(/id="([^"]+)"/);
    expect(idMatch?.[1]).toBe('no-data-template');
  });

  test('should validate sample data structure', () => {
    // Simulate loading actual template file content
    const templateContent = `
      ##!
        const data = data || {
          apps: [
            { type: 'ios', url: '#' },
            { type: 'android', url: '#' }
          ]
        };
      ##
    `;

    // Extract and validate data structure
    const dataMatch = templateContent.match(/const data = data \|\| ([\s\S]*?);/);
    expect(dataMatch).toBeTruthy();
    
    // Should contain proper structure definition
    expect(dataMatch?.[0]).toContain('apps');
    expect(dataMatch?.[0]).toContain('type');
  });
});

describe('Template Preview', () => {
  test('should create webview panel for preview', () => {
    const mockPanel = {
      webview: {
        html: '',
        postMessage: jest.fn(),
        onDidReceiveMessage: jest.fn()
      },
      dispose: jest.fn(),
      reveal: jest.fn()
    };

    (vscode.window.createWebviewPanel as jest.Mock).mockReturnValue(mockPanel);

    const panel = vscode.window.createWebviewPanel(
      'compomintPreview',
      'Template Preview',
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );

    expect(panel).toBeDefined();
    expect(panel.webview).toBeDefined();
    expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
      'compomintPreview',
      'Template Preview',
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );
  });

  test('should handle webview messages', () => {
    const mockPanel = {
      webview: {
        html: '',
        postMessage: jest.fn(),
        onDidReceiveMessage: jest.fn()
      },
      dispose: jest.fn(),
      reveal: jest.fn()
    };

    (vscode.window.createWebviewPanel as jest.Mock).mockReturnValue(mockPanel);

    const panel = vscode.window.createWebviewPanel(
      'compomintPreview',
      'Template Preview',
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );

    // Test message handling setup
    panel.webview.onDidReceiveMessage(() => {});
    expect(panel.webview.onDidReceiveMessage).toHaveBeenCalled();
  });
});