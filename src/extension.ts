import * as vscode from 'vscode';
import * as path from 'path';

function getFileExtensions(): string[] {
  const config = vscode.workspace.getConfiguration('compomint');
  const extensions = config.get<string>('fileExtensionFilter', 'html,htm');
  return extensions
    .split(',')
    .map(ext => ext.trim())
    .filter(ext => ext);
}

// Decorator types for different Compomint expression types
let compomintDecorators: { [key: string]: vscode.TextEditorDecorationType } = {};

function initializeDecorators() {
  // Clear existing decorators
  Object.values(compomintDecorators).forEach(decorator => decorator.dispose());

  const config = vscode.workspace.getConfiguration('compomint');
  const decoratorColors = config.get<any>('decoratorColors');
  const overviewRulerColors = config.get<any>('overviewRulerColors');

  compomintDecorators = {
    interpolation: vscode.window.createTextEditorDecorationType({
      backgroundColor: decoratorColors.interpolation,
      overviewRulerColor: overviewRulerColors.interpolation,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    }),
    escape: vscode.window.createTextEditorDecorationType({
      backgroundColor: decoratorColors.escape,
      overviewRulerColor: overviewRulerColors.escape,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    }),
    element: vscode.window.createTextEditorDecorationType({
      backgroundColor: decoratorColors.element,
      overviewRulerColor: overviewRulerColors.element,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    }),
    preEval: vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: decoratorColors.preEval,
      overviewRulerColor: overviewRulerColors.preEval,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    }),
    lazyEval: vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: decoratorColors.lazyEval,
      overviewRulerColor: overviewRulerColors.lazyEval,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    }),
    comment: vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: decoratorColors.comment,
      fontStyle: 'italic',
      overviewRulerColor: overviewRulerColors.comment,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    }),
    colon: vscode.window.createTextEditorDecorationType({
      backgroundColor: decoratorColors.colon,
      overviewRulerColor: overviewRulerColors.colon,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    }),
    code: vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: decoratorColors.code,
      overviewRulerColor: overviewRulerColors.code,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    }),
  };
}

function updateCompomintDecorations(editor: vscode.TextEditor) {
  const config = vscode.workspace.getConfiguration('compomint');
  const syntaxHighlightingEnabled = config.get<boolean>('enableSyntaxHighlighting', true);

  if (!syntaxHighlightingEnabled) {
    // Clear all decorations when disabled
    Object.values(compomintDecorators).forEach(decorator => {
      editor.setDecorations(decorator, []);
    });
    return;
  }

  const text = editor.document.getText();
  const decorationGroups: { [key: string]: vscode.DecorationOptions[] } = {
    interpolation: [],
    escape: [],
    element: [],
    preEval: [],
    lazyEval: [],
    comment: [],
    colon: [],
    code: [],
  };

  // Find all Compomint expressions in order, avoiding overlaps
  const allMatches: Array<{
    start: number;
    end: number;
    type: string;
    text: string;
  }> = [];

  // Pattern for any Compomint expression (allows empty content, includes colon)
  const globalRegex = /##(?:[=\-!%#*:](?:[^#]|#(?!#))*|(?![=\-!%#*:])(?:[^#]|#(?!#))*)##/g;

  let match;
  while ((match = globalRegex.exec(text)) !== null) {
    const matchText = match[0];
    let type = 'code'; // default

    // Determine type based on the prefix
    if (matchText.startsWith('##=')) {
      type = 'interpolation';
    } else if (matchText.startsWith('##-')) {
      type = 'escape';
    } else if (matchText.startsWith('##%')) {
      type = 'element';
    } else if (matchText.startsWith('##!')) {
      type = 'preEval';
    } else if (matchText.startsWith('###')) {
      type = 'lazyEval';
    } else if (matchText.startsWith('##*')) {
      type = 'comment';
    } else if (matchText.startsWith('##:')) {
      type = 'colon';
    }

    allMatches.push({
      start: match.index,
      end: match.index + matchText.length,
      type: type,
      text: matchText,
    });

    // Debug log for testing
  }

  // Convert matches to decorations
  allMatches.forEach(matchInfo => {
    const startPos = editor.document.positionAt(matchInfo.start);
    const endPos = editor.document.positionAt(matchInfo.end);
    decorationGroups[matchInfo.type].push({
      range: new vscode.Range(startPos, endPos),
    });
  });

  // Apply decorations
  Object.entries(decorationGroups).forEach(([type, decorations]) => {
    if (compomintDecorators[type]) {
      editor.setDecorations(compomintDecorators[type], decorations);
    }
  });
}

function initializeSyntaxHighlighting(context: vscode.ExtensionContext) {
  initializeDecorators();

  // Apply decorations to active editor
  if (vscode.window.activeTextEditor) {
    updateCompomintDecorations(vscode.window.activeTextEditor);
  }

  // Listen for editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        updateCompomintDecorations(editor);
      }
    })
  );

  // Listen for document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      const editor = vscode.window.visibleTextEditors.find(e => e.document === event.document);
      if (editor) {
        updateCompomintDecorations(editor);
      }
    })
  );
}

export function activate(context: vscode.ExtensionContext) {

  // Register diagnostic collection
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('compomint');

  // Initialize syntax highlighting based on settings
  initializeSyntaxHighlighting(context);

  // Create template provider
  const templateProvider = new CompomintTemplateProvider();

  // Register tree data provider for templates view
  vscode.window.registerTreeDataProvider('compomint.templatesView', templateProvider);

  // Initial refresh after a short delay to ensure workspace is ready
  setTimeout(() => {
    templateProvider.refresh();
    // Scan workspace for sample data
    scanWorkspaceForSampleData();
  }, 100);

  // Watch for file changes to update sample data
  const fileExtensions = getFileExtensions();
  const sampleDataWatcher = vscode.workspace.createFileSystemWatcher(
    `**/*.{${fileExtensions.join(',')}}`
  );

  sampleDataWatcher.onDidChange(() => {
    scanWorkspaceForSampleData();
  });

  sampleDataWatcher.onDidCreate(() => {
    scanWorkspaceForSampleData();
  });

  sampleDataWatcher.onDidDelete(() => {
    scanWorkspaceForSampleData();
  });

  context.subscriptions.push(sampleDataWatcher);

  // Register webview view provider for filter
  const filterProvider = new CompomintFilterProvider(context.extensionUri, templateProvider);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('compomint.filterView', filterProvider)
  );

  // Register webview view provider for preview
  const previewProvider = new CompomintPreviewProvider(context.extensionUri);

  // Register webview view provider for resources
  const resourceProvider = new CompomintResourceProvider(context.extensionUri, previewProvider);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('compomint.resourcesView', resourceProvider)
  );

  // Update preview provider to use resource provider
  (previewProvider as any)._resourceProvider = resourceProvider;
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('compomint.previewView', previewProvider)
  );

  // Register commands

  // Register new commands for sidebar
  const refreshCommand = vscode.commands.registerCommand('compomint.refreshTemplates', () => {
    templateProvider.refresh();
    // Also rescan sample data when refreshing templates
    scanWorkspaceForSampleData();
  });

  const previewInSidebarCommand = vscode.commands.registerCommand(
    'compomint.previewTemplateInSidebar',
    (template: TemplateItem) => {
      if (template && template.templateId) {
        previewProvider.showTemplate(template);
      } else {
        console.error('Invalid template item received:', template);
        vscode.window.showErrorMessage('Invalid template selected');
      }
    }
  );

  const openFileCommand = vscode.commands.registerCommand(
    'compomint.openFile',
    async (item: FileItem | TemplateItem) => {
      try {
        let filePath: string;
        let lineNumber: number | undefined;

        if (item instanceof FileItem) {
          filePath = item.filePath;
        } else if (item instanceof TemplateItem) {
          filePath = item.filePath;
          // Try to find the line number of the template
          const document = await vscode.workspace.openTextDocument(filePath);
          const text = document.getText();
          const lines = text.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (
              lines[i].includes(`id="${item.templateId}"`) ||
              lines[i].includes(`id='${item.templateId}'`)
            ) {
              lineNumber = i;
              break;
            }
          }
        } else {
          throw new Error('Invalid item type');
        }

        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document);

        // Jump to template line if found
        if (lineNumber !== undefined) {
          const position = new vscode.Position(lineNumber, 0);
          editor.selection = new vscode.Selection(position, position);
          editor.revealRange(new vscode.Range(position, position));
        }
      } catch (error) {
        console.error('Error opening file:', error);
        vscode.window.showErrorMessage(`Failed to open file: ${error}`);
      }
    }
  );

  const previewFromEditorCommand = vscode.commands.registerCommand(
    'compomint.previewTemplateFromEditor',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      const document = editor.document;
      const extensions = getFileExtensions();
      if (!extensions.includes(document.languageId)) {
        vscode.window.showErrorMessage('Not an HTML document');
        return;
      }

      // Find template at cursor position
      const position = editor.selection.active;
      const text = document.getText();
      const offset = document.offsetAt(position);

      // Find template that contains the cursor position
      const templateRegex = /<template\s+id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/template>/g;
      let match;
      let targetTemplate: { id: string; content: string } | undefined;

      while ((match = templateRegex.exec(text)) !== null) {
        const startOffset = match.index;
        const endOffset = match.index + match[0].length;

        if (offset >= startOffset && offset <= endOffset) {
          targetTemplate = {
            id: match[1],
            content: match[2],
          };
          break;
        }
      }

      if (!targetTemplate) {
        vscode.window.showErrorMessage('No template found at cursor position');
        return;
      }

      // Create a TemplateItem and show it in the preview
      const templateItem = new TemplateItem(
        targetTemplate.id,
        targetTemplate.id,
        document.uri.fsPath,
        targetTemplate.content,
        vscode.TreeItemCollapsibleState.None
      );

      previewProvider.showTemplate(templateItem);
      vscode.window.showInformationMessage(`Previewing template: ${targetTemplate.id}`);
    }
  );

  const createTemplateInFileCommand = vscode.commands.registerCommand(
    'compomint.createTemplateInFile',
    async (item: FileItem) => {

      if (!item || !(item instanceof FileItem)) {
        vscode.window.showErrorMessage('Invalid file selected');
        return;
      }

      try {
        // Open the file first
        const document = await vscode.workspace.openTextDocument(item.filePath);
        const editor = await vscode.window.showTextDocument(document);

        // Ask for component name
        const componentName = await vscode.window.showInputBox({
          placeHolder: 'Template Id ( like "compo-InputForm" )',
          prompt: 'Enter Template Id',
          validateInput: value => {
            if (!value) {
              return 'Template Id is required';
            }
            if (!/^[a-zA-Z][a-zA-Z0-9\-]*$/.test(value)) {
              return 'Template Id must start with letter and contain only alphanumeric characters and hyphens';
            }
            return null;
          },
        });

        if (!componentName) {
          return; // User cancelled
        }

        const templateId = `${componentName}`;

        // Ask for template type
        const templateTypes = [
          {
            label: 'Simple Template',
            description: 'Basic template with minimal structure',
          },
          {
            label: 'Basic Template',
            description: 'Template with style and basic structure',
          },
          {
            label: 'I18n Template',
            description: 'Template with internationalization support',
          },
          {
            label: 'Comprehensive Template',
            description: 'Template with all Compomint features',
          },
        ];

        const templateType = await vscode.window.showQuickPick(templateTypes, {
          placeHolder: 'Select template type',
        });

        if (!templateType) {
          return; // User cancelled
        }

        // Generate template content based on type
        const templateContent = generateTemplateContent(templateType.label, templateId);

        // Position cursor at the end of the document
        const position = new vscode.Position(document.lineCount, 0);
        editor.selection = new vscode.Selection(position, position);

        // Insert template
        await editor.edit(editBuilder => {
          editBuilder.insert(position, '\n' + templateContent);
        });

        vscode.window.showInformationMessage(
          `Template "${templateId}" added to ${path.basename(item.filePath)}`
        );

        // Refresh template provider
        templateProvider.refresh();
      } catch (error) {
        console.error('Error creating template in file:', error);
        vscode.window.showErrorMessage(`Failed to create template: ${error}`);
      }
    }
  );

  const createTemplateInDirectoryCommand = vscode.commands.registerCommand(
    'compomint.createTemplateInDirectory',
    async (item: DirectoryItem) => {

      if (!item || !(item instanceof DirectoryItem)) {
        vscode.window.showErrorMessage('Invalid directory selected');
        return;
      }

      try {

        // Ask for component name
        const templateIdInput = await vscode.window.showInputBox({
          placeHolder: 'Template Id ( like "compo-InputForm" )',
          prompt: 'Enter Template Id',
          validateInput: value => {
            if (!value) {
              return 'Template Id is required';
            }
            if (!/^[a-zA-Z][a-zA-Z0-9\-]*$/.test(value)) {
              return 'Template Id must start with letter and contain only alphanumeric characters and hyphens';
            }
            return null;
          },
        });

        if (!templateIdInput) {
          return; // User cancelled
        }

        const templateId = `${templateIdInput}`;

        // Ask for template type
        const templateTypes = [
          {
            label: 'Simple Template',
            description: 'Basic template with minimal structure',
          },
          {
            label: 'Basic Template',
            description: 'Template with style and basic structure',
          },
          {
            label: 'I18n Template',
            description: 'Template with internationalization support',
          },
          {
            label: 'Comprehensive Template',
            description: 'Template with all Compomint features',
          },
        ];

        const templateType = await vscode.window.showQuickPick(templateTypes, {
          placeHolder: 'Select template type',
        });

        if (!templateType) {
          return; // User cancelled
        }

        // Generate template content
        const templateContent = generateTemplateContent(templateType.label, templateId);

        // Create new file in the directory
        const dirPath = item.dirPath;
        const fileName = `${templateId}.html`;
        const filePath = path.join(dirPath, fileName);

        // Check if file already exists
        try {
          await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
          vscode.window.showErrorMessage(`File ${fileName} already exists in this directory`);
          return;
        } catch {
          // File doesn't exist, continue
        }

        // Create the file with template content
        const fullContent = `${templateContent}`;

        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(filePath),
          Buffer.from(fullContent, 'utf8')
        );

        // Open the new file
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage(
          `Template file "${fileName}" created in ${path.basename(dirPath)}`
        );

        // Refresh template provider
        templateProvider.refresh();
      } catch (error) {
        console.error('Error creating template in directory:', error);
        vscode.window.showErrorMessage(`Failed to create template: ${error}`);
      }
    }
  );

  // Register hover provider
  const hoverProvider = vscode.languages.registerHoverProvider(
    { language: 'html', scheme: 'file' },
    new CompomintHoverProvider()
  );

  // Add to subscriptions
  context.subscriptions.push(
    refreshCommand,
    previewInSidebarCommand,
    openFileCommand,
    previewFromEditorCommand,
    createTemplateInFileCommand,
    createTemplateInDirectoryCommand,
    hoverProvider,
    diagnosticCollection,
    // Register document save event for template validation
    vscode.workspace.onDidSaveTextDocument(document => {
      const config = vscode.workspace.getConfiguration('compomint');
      if (document.languageId === 'html' && config.get<boolean>('validateOnSave', true)) {
        validateTemplatesInDocument(document, diagnosticCollection);
      }
    })
  );

  // Watch for file changes to refresh template list
  const createFileWatcher = () => {
    const config = vscode.workspace.getConfiguration('compomint');
    const extensions = config.get<string>('fileExtensionFilter', 'html,htm');
    const extList = extensions
      .split(',')
      .map(ext => ext.trim())
      .filter(ext => ext);

    // Create pattern for all extensions
    const pattern = extList.length === 1 ? `**/*.${extList[0]}` : `**/*.{${extList.join(',')}}`;

    const fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
    fileWatcher.onDidChange(() => templateProvider.refresh());
    fileWatcher.onDidCreate(() => templateProvider.refresh());
    fileWatcher.onDidDelete(() => templateProvider.refresh());
    return fileWatcher;
  };

  let fileWatcher = createFileWatcher();
  context.subscriptions.push(fileWatcher);

  // Watch for configuration changes
  const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
    if (
      e.affectsConfiguration('compomint.fileExtensionFilter') ||
      e.affectsConfiguration('compomint.templateIdFilter')
    ) {
      // Recreate file watcher with new extensions
      fileWatcher.dispose();
      fileWatcher = createFileWatcher();
      context.subscriptions.push(fileWatcher);

      // Refresh templates
      templateProvider.refresh();
    }

    if (e.affectsConfiguration('compomint.enableValidation')) {
      // Refresh validation for all open documents
      const config = vscode.workspace.getConfiguration('compomint');
      const validationEnabled = config.get<boolean>('enableValidation', true);

      if (!validationEnabled) {
        // Clear all diagnostics if validation is disabled
        diagnosticCollection.clear();
      } else {
        // Re-validate all open documents
        vscode.workspace.textDocuments.forEach(document => {
          const fileExtension = document.uri.fsPath.split('.').pop()?.toLowerCase();
          const extensions = getFileExtensions();
          if (fileExtension && extensions.includes(fileExtension)) {
            validateTemplatesInDocument(document, diagnosticCollection);
          }
        });
      }
    }

    if (
      e.affectsConfiguration('compomint.enableSyntaxHighlighting') ||
      e.affectsConfiguration('compomint.decoratorColors') ||
      e.affectsConfiguration('compomint.overviewRulerColors')
    ) {
      // Reinitialize decorators if color settings changed
      if (
        e.affectsConfiguration('compomint.decoratorColors') ||
        e.affectsConfiguration('compomint.overviewRulerColors')
      ) {
        initializeDecorators();
      }

      // Update decorations for all visible editors immediately
      vscode.window.visibleTextEditors.forEach(editor => {
        updateCompomintDecorations(editor);
      });
    }
  });
  context.subscriptions.push(configWatcher);
}

// Hover provider for Compomint expressions
class CompomintHoverProvider implements vscode.HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
    const range = document.getWordRangeAtPosition(position, /##[=\-%!#*]?.*?##/);
    if (!range) return undefined;

    const text = document.getText(range);

    // Determine expression type and provide documentation
    if (text.startsWith('##=')) {
      return new vscode.Hover(
        new vscode.MarkdownString(
          '**Compomint Interpolation**\n\nOutputs the value of a JavaScript expression.'
        )
      );
    } else if (text.startsWith('##-')) {
      return new vscode.Hover(
        new vscode.MarkdownString(
          '**Compomint HTML Escape**\n\nOutputs the HTML-escaped value of a JavaScript expression.'
        )
      );
    } else if (text.startsWith('##%')) {
      return new vscode.Hover(
        new vscode.MarkdownString(
          '**Compomint Element Insertion**\n\nInserts a component, HTML element, or string.'
        )
      );
    } else if (text.startsWith('##!')) {
      return new vscode.Hover(
        new vscode.MarkdownString(
          '**Compomint Pre-evaluation**\n\nExecutes code when the template is first loaded (not on each render).'
        )
      );
    } else if (text.startsWith('###')) {
      return new vscode.Hover(
        new vscode.MarkdownString(
          '**Compomint Lazy Evaluation**\n\nExecutes code after the template is rendered and inserted into the DOM.'
        )
      );
    } else if (text.startsWith('##*')) {
      return new vscode.Hover(
        new vscode.MarkdownString(
          '**Compomint Comment**\n\nA comment that will not be included in the rendered output.'
        )
      );
    } else if (text.startsWith('##') && text.endsWith('##')) {
      return new vscode.Hover(
        new vscode.MarkdownString(
          '**Compomint Code Block**\n\nExecutes JavaScript code during rendering.'
        )
      );
    }

    // Check for Compomint attributes
    const attributeRange = document.getWordRangeAtPosition(position, /data-co-[a-z-]+="##:.*?##"/);
    if (attributeRange) {
      const attrText = document.getText(attributeRange);

      if (attrText.startsWith('data-co-event')) {
        return new vscode.Hover(
          new vscode.MarkdownString(
            '**Compomint Event Handler**\n\nAttaches event handlers to HTML elements.'
          )
        );
      } else if (attrText.startsWith('data-co-named-element')) {
        return new vscode.Hover(
          new vscode.MarkdownString(
            '**Compomint Named Element**\n\nCreates a named reference to an element in the template scope.'
          )
        );
      } else if (attrText.startsWith('data-co-element-ref')) {
        return new vscode.Hover(
          new vscode.MarkdownString(
            '**Compomint Element Reference**\n\nBinds a DOM element to a variable in the template code.'
          )
        );
      } else if (attrText.startsWith('data-co-props')) {
        return new vscode.Hover(
          new vscode.MarkdownString(
            '**Compomint Properties**\n\nSets multiple attributes on an element.'
          )
        );
      } else if (attrText.startsWith('data-co-load')) {
        return new vscode.Hover(
          new vscode.MarkdownString(
            '**Compomint Load Handler**\n\nExecutes a function when an element is loaded into the DOM.'
          )
        );
      }
    }

    return undefined;
  }
}

// Validate templates in a document
function validateTemplatesInDocument(
  document: vscode.TextDocument,
  diagnosticCollection: vscode.DiagnosticCollection
) {
  // Check if validation is enabled
  const config = vscode.workspace.getConfiguration('compomint');
  const validationEnabled = config.get<boolean>('enableValidation', true);

  if (!validationEnabled) {
    // Clear any existing diagnostics for this document
    diagnosticCollection.delete(document.uri);
    return;
  }

  const extensions = getFileExtensions();
  if (!extensions.includes(document.languageId)) {
    return;
  }

  const text = document.getText();
  const diagnostics: vscode.Diagnostic[] = [];

  // Check for template id uniqueness
  const templateIds = new Set<string>();
  const templateIdRegex = /<template\s+id=["']([^"']+)["'][^>]*>/g;
  let match;

  while ((match = templateIdRegex.exec(text)) !== null) {
    const id = match[1];
    const startPos = document.positionAt(match.index + match[0].indexOf(id));
    const endPos = document.positionAt(match.index + match[0].indexOf(id) + id.length);

    if (templateIds.has(id)) {
      // Duplicate template ID
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(startPos, endPos),
          `Duplicate template ID: ${id}`,
          vscode.DiagnosticSeverity.Error
        )
      );
    }

    templateIds.add(id);
  }

  // Validate style IDs match template IDs
  const styleIdRegex = /<style\s+id=["']style-([^"']+)["'][^>]*>/g;
  while ((match = styleIdRegex.exec(text)) !== null) {
    const styleId = match[1];
    const startPos = document.positionAt(match.index + match[0].indexOf(styleId));
    const endPos = document.positionAt(match.index + match[0].indexOf(styleId) + styleId.length);

    // Find corresponding template
    const templateExists = Array.from(templateIds).some(id => id === styleId);
    if (!templateExists) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(startPos, endPos),
          `Style ID 'style-${styleId}' does not match any template ID`,
          vscode.DiagnosticSeverity.Warning
        )
      );
    }
  }

  // Check for unbalanced Compomint expression delimiters
  const delimiterErrors = validateCompomintDelimiters(text, document);
  diagnostics.push(...delimiterErrors);

  // Set diagnostics
  diagnosticCollection.set(document.uri, diagnostics);
}

// Validate Compomint delimiters with proper parsing
function validateCompomintDelimiters(
  text: string,
  document: vscode.TextDocument
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  const stack: { type: string; position: number; text: string }[] = [];

  // Single pass through the text to find all delimiters
  const tokens: {
    type: string;
    position: number;
    text: string;
    isOpener: boolean;
  }[] = [];

  let i = 0;
  let token = null;
  while (i < text.length) {
    if (text[i] === '#' && text[i + 1] === '#') {
      // Check for specific opening patterns first (longest match first)
      if (text.substring(i, i + 3) === '###') {
        // Lazy evaluation opener
        token = {
          type: 'lazy-evaluation',
          position: i,
          text: '###',
          isOpener: true,
        };
        i += 3;
      } else if (text.substring(i, i + 3) === '##=') {
        // Interpolation opener
        token = {
          type: 'interpolation',
          position: i,
          text: '##=',
          isOpener: true,
        };
        i += 3;
      } else if (text.substring(i, i + 3) === '##-') {
        // HTML escape opener
        token = {
          type: 'html-escape',
          position: i,
          text: '##-',
          isOpener: true,
        };
        i += 3;
      } else if (text.substring(i, i + 3) === '##%') {
        // Element insertion opener
        token = {
          type: 'element-insertion',
          position: i,
          text: '##%',
          isOpener: true,
        };
        i += 3;
      } else if (text.substring(i, i + 3) === '##!') {
        // Pre-evaluation opener
        token = {
          type: 'pre-evaluation',
          position: i,
          text: '##!',
          isOpener: true,
        };
        i += 3;
      } else if (text.substring(i, i + 3) === '##*') {
        // Comment opener
        token = {
          type: 'comment',
          position: i,
          text: '##*',
          isOpener: true,
        };
        i += 3;
      } else if (text.substring(i, i + 2) === '##') {
        // Check if this is a closer or code-block opener
        // Look at the stack to determine context
        if (token && (token as any).isOpener) {
          // If there's an open expression, this is likely a closer
          token = {
            type: 'closer',
            position: i,
            text: '##',
            isOpener: false,
          };
        } else {
          // No open expressions, this could be a code-block opener
          // Check if the next ## exists to confirm it's a code block
          const nextHashPos = text.indexOf('##', i + 2);
          if (nextHashPos !== -1) {
            // There's a potential closing ##, treat as code-block opener
            token = {
              type: 'code-block',
              position: i,
              text: '##',
              isOpener: true,
            };
          } else {
            // No closing ##, this is an unmatched closer
            token = {
              type: 'closer',
              position: i,
              text: '##',
              isOpener: false,
            };
          }
        }
        i += 2;
      } else {
        i++;
        continue;
      }

      if (token) {
        tokens.push(token);
      }
    } else {
      i++;
    }
  }

  // Process tokens to find unbalanced delimiters
  for (const token of tokens) {
    if (token.isOpener) {
      stack.push({
        type: token.type,
        position: token.position,
        text: token.text,
      });
    } else {
      // This is a closing delimiter
      if (stack.length === 0) {
        // Closing delimiter without opening
        const startPos = document.positionAt(token.position);
        const endPos = document.positionAt(token.position + token.text.length);

        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(startPos, endPos),
            `Unexpected closing delimiter '${token.text}' - no matching opening delimiter`,
            vscode.DiagnosticSeverity.Error
          )
        );
      } else {
        // Match with the most recent opening delimiter
        stack.pop();
      }
    }
  }

  // Check for unmatched opening delimiters
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    const startPos = document.positionAt(unclosed.position);
    const endPos = document.positionAt(unclosed.position + unclosed.text.length);

    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(startPos, endPos),
        `Unclosed Compomint expression '${unclosed.text}' - missing closing delimiter '##'`,
        vscode.DiagnosticSeverity.Error
      )
    );
  }

  return diagnostics;
}

// Base class for tree items
abstract class BaseTreeItem extends vscode.TreeItem {
  abstract readonly itemType: 'directory' | 'file' | 'template';
}

// Directory item for tree view
class DirectoryItem extends BaseTreeItem {
  readonly itemType = 'directory' as const;

  constructor(
    public readonly label: string,
    public readonly dirPath: string,
    public readonly children: BaseTreeItem[],
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = this.dirPath;
    this.contextValue = 'directory';
    this.iconPath = new vscode.ThemeIcon('folder');
  }
}

// File item for tree view
class FileItem extends BaseTreeItem {
  readonly itemType = 'file' as const;

  constructor(
    public readonly label: string,
    public readonly filePath: string,
    public readonly templates: TemplateItem[],
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = this.filePath;
    this.contextValue = 'file';
    this.iconPath = new vscode.ThemeIcon('file-text');
    this.resourceUri = vscode.Uri.file(this.filePath);
  }
}

// Template item for tree view
class TemplateItem extends BaseTreeItem {
  readonly itemType = 'template' as const;

  constructor(
    public readonly label: string,
    public readonly templateId: string,
    public readonly filePath: string,
    public readonly content: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label} - ${this.filePath}`;
    this.contextValue = 'template';
    this.iconPath = new vscode.ThemeIcon('symbol-class');
    this.command = {
      command: 'compomint.previewTemplateInSidebar',
      title: 'Preview Template',
      arguments: [this],
    };
  }
}

// Tree data provider for templates
class CompomintTemplateProvider implements vscode.TreeDataProvider<BaseTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<BaseTreeItem | undefined | null | void> =
    new vscode.EventEmitter<BaseTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<BaseTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private templates: Map<string, TemplateItem[]> = new Map();
  private rootItems: BaseTreeItem[] = [];

  constructor() {
    // Don't refresh in constructor, wait for activation
  }

  refresh(): void {
    this.templates.clear();
    this.rootItems = [];
    this.findTemplates().then(() => {
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: BaseTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: BaseTreeItem): Thenable<BaseTreeItem[]> {
    if (!element) {
      // Return root directory structure
      return Promise.resolve(this.rootItems);
    } else if (element instanceof DirectoryItem) {
      // Return children of directory
      return Promise.resolve(element.children);
    } else if (element instanceof FileItem) {
      // Return templates for this file
      return Promise.resolve(element.templates);
    }
    return Promise.resolve([]);
  }

  private matchesFilter(templateId: string): boolean {
    const config = vscode.workspace.getConfiguration('compomint');
    const filterPattern = config.get<string>('templateIdFilter', '');

    if (!filterPattern.trim()) {
      return true; // No filter means show all
    }

    const patterns = filterPattern
      .split(',')
      .map(p => p.trim())
      .filter(p => p);
    if (patterns.length === 0) {
      return true;
    }

    return patterns.some(pattern => {
      // Convert glob-like pattern to regex
      const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
      const regex = new RegExp(`^${regexPattern}$`, 'i');
      return regex.test(templateId);
    });
  }

  private async findTemplates(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return;
    }

    const extensions = getFileExtensions();

    for (const folder of workspaceFolders) {
      try {
        // Search for files with specified extensions
        for (const ext of extensions) {
          const pattern = new vscode.RelativePattern(folder, `**/*.${ext}`);
          const excludePattern = '**/node_modules/**';

          const files = await vscode.workspace.findFiles(pattern, excludePattern);

          for (const file of files) {
            try {
              const content = await vscode.workspace.fs.readFile(file);
              const text = Buffer.from(content).toString('utf8');
              const templates = this.extractTemplates(text, file.fsPath);

              // Apply template ID filter
              const filteredTemplates = templates.filter(template =>
                this.matchesFilter(template.templateId)
              );

              if (filteredTemplates.length > 0) {
                this.templates.set(file.fsPath, filteredTemplates);
              }
            } catch (error) {
              console.error(`Error reading file ${file.fsPath}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error searching in folder ${folder.uri.fsPath}:`, error);
      }
    }

    // Build directory structure
    this.buildDirectoryStructure();

  }

  private buildDirectoryStructure(): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    this.rootItems = [];

    // Process each workspace folder separately
    workspaceFolders.forEach(workspaceFolder => {
      const workspacePath = workspaceFolder.uri.fsPath;
      const workspaceName = workspaceFolder.name;

      // Find templates that belong to this workspace
      const workspaceTemplates = new Map<string, TemplateItem[]>();
      this.templates.forEach((templates, filePath) => {
        if (filePath.startsWith(workspacePath)) {
          workspaceTemplates.set(filePath, templates);
        }
      });

      if (workspaceTemplates.size === 0) {
        return; // No templates in this workspace
      }

      const dirMap = new Map<string, { files: FileItem[]; directories: Set<string> }>();

      // Group files by directory (relative to workspace)
      workspaceTemplates.forEach((templates, filePath) => {
        // Convert to relative path from workspace root
        const relativePath = path.relative(workspacePath, filePath);
        const relativeDir = path.dirname(relativePath);
        const fileName = path.basename(filePath);

        // Use '.' for root directory
        const dirKey = relativeDir === '.' ? '' : relativeDir.replace(/\\/g, '/');

        if (!dirMap.has(dirKey)) {
          dirMap.set(dirKey, { files: [], directories: new Set() });
        }

        // Sort templates by template ID
        const sortedTemplates = templates.sort((a, b) => a.templateId.localeCompare(b.templateId));

        const fileItem = new FileItem(
          `${fileName} (${templates.length})`,
          filePath,
          sortedTemplates,
          vscode.TreeItemCollapsibleState.Expanded
        );

        dirMap.get(dirKey)!.files.push(fileItem);
      });

      // Find all parent directories (relative paths)
      const allDirs = new Set<string>();
      dirMap.forEach((_, dir) => {
        if (dir === '') {
          allDirs.add('');
          return;
        }

        let currentDir = dir;
        while (currentDir && currentDir !== '.') {
          allDirs.add(currentDir);
          const parentDir = path.dirname(currentDir);
          if (parentDir === currentDir || parentDir === '.') {
            allDirs.add('');
            break;
          }
          currentDir = parentDir;
        }
      });

      // Build directory tree hierarchy
      allDirs.forEach(dir => {
        if (dir === '') return; // Skip root

        const parentDir = path.dirname(dir);
        const parentKey = parentDir === '.' ? '' : parentDir;

        if (allDirs.has(parentKey)) {
          if (!dirMap.has(parentKey)) {
            dirMap.set(parentKey, { files: [], directories: new Set() });
          }
          dirMap.get(parentKey)!.directories.add(dir);
        }
      });

      // Create directory items
      const dirItems = new Map<string, DirectoryItem>();

      const createDirItem = (dirKey: string): DirectoryItem | BaseTreeItem[] => {
        if (dirKey === '') {
          // Root directory - return children for workspace
          const rootInfo = dirMap.get('') || {
            files: [],
            directories: new Set(),
          };
          const children: BaseTreeItem[] = [];

          // Add subdirectories
          const sortedDirs = Array.from(rootInfo.directories).sort();
          sortedDirs.forEach(subDirKey => {
            const subItem = createDirItem(subDirKey);
            if (subItem instanceof DirectoryItem) {
              children.push(subItem);
            }
          });

          // Add files (sorted by name)
          const sortedFiles = rootInfo.files.sort((a, b) => a.label.localeCompare(b.label));
          children.push(...sortedFiles);

          return children;
        }

        if (dirItems.has(dirKey)) {
          return dirItems.get(dirKey)!;
        }

        const dirInfo = dirMap.get(dirKey) || {
          files: [],
          directories: new Set(),
        };
        const children: BaseTreeItem[] = [];

        // Add subdirectories (sorted)
        const sortedSubDirs = Array.from(dirInfo.directories).sort();
        sortedSubDirs.forEach(subDirKey => {
          const subItem = createDirItem(subDirKey);
          if (subItem instanceof DirectoryItem) {
            children.push(subItem);
          }
        });

        // Add files (sorted by name)
        const sortedDirFiles = dirInfo.files.sort((a, b) => a.label.localeCompare(b.label));
        children.push(...sortedDirFiles);

        const dirName = path.basename(dirKey);
        const dirItem = new DirectoryItem(
          dirName,
          dirKey,
          children,
          vscode.TreeItemCollapsibleState.Expanded
        );

        dirItems.set(dirKey, dirItem);
        return dirItem;
      };

      // Create workspace root item
      const workspaceChildren = createDirItem('');

      if (Array.isArray(workspaceChildren) && workspaceChildren.length > 0) {
        // Create workspace folder item
        const workspaceItem = new DirectoryItem(
          workspaceName,
          workspacePath,
          workspaceChildren,
          vscode.TreeItemCollapsibleState.Expanded
        );
        this.rootItems.push(workspaceItem);
      }
    });

    // If no workspace items but we have templates, create a simple file list
    if (this.rootItems.length === 0 && this.templates.size > 0) {
      this.templates.forEach((templates, filePath) => {
        const fileName = path.basename(filePath);
        const fileItem = new FileItem(
          `${fileName} (${templates.length})`,
          filePath,
          templates,
          vscode.TreeItemCollapsibleState.Expanded
        );
        this.rootItems.push(fileItem);
      });
    }
  }

  private extractTemplates(content: string, filePath: string): TemplateItem[] {
    const templateRegex = /<template\s+id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/template>/g;
    const templates: TemplateItem[] = [];
    let match;

    while ((match = templateRegex.exec(content)) !== null) {
      const templateId = match[1];
      const templateContent = match[2];

      templates.push(
        new TemplateItem(
          templateId,
          templateId,
          filePath,
          templateContent,
          vscode.TreeItemCollapsibleState.None
        )
      );
    }

    return templates;
  }
}

// Webview view provider for template preview
class CompomintPreviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'compomint.previewView';

  private _view?: vscode.WebviewView;
  private currentTemplate?: TemplateItem;
  private _resourceProvider?: CompomintResourceProvider;
  private _activeTabPanels: vscode.WebviewPanel[] = [];

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.command) {
        case 'error':
          vscode.window.showErrorMessage(`Template Error: ${data.text}`);
          break;
        case 'ready':
          this.ensureLanguageSettings();
          // If we have a template waiting to be shown, show it now
          if (this.currentTemplate) {
            this.updatePreview();
          }
          break;
        case 'updateLanguage':
          this.updateCurrentLanguage(data.language);
          break;
        case 'openTemplateInTab':
          this.openTemplateInTab(data.template, data.data, data.language);
          break;
        case 'getSampleData':
          this.sendSampleDataToWebview(data.templateId);
          break;
      }
    });
  }

  public showTemplate(template: TemplateItem) {
    this.currentTemplate = template;

    if (this._view) {
      this._view.show?.(true);
      this.updatePreview();
    }
  }

  private async ensureLanguageSettings() {
    const config = vscode.workspace.getConfiguration('compomint');
    const availableLanguages = config.get<string[]>('availableLanguages');
    const currentLanguage = config.get<string>('currentLanguage');
    const libraryUrl = config.get<string>('libraryUrl');

    // Add missing settings with defaults

    await config.update(
      'availableLanguages',
      availableLanguages,
      vscode.ConfigurationTarget.Workspace
    );
    await config.update('currentLanguage', currentLanguage, vscode.ConfigurationTarget.Workspace);
    await config.update('libraryUrl', libraryUrl, vscode.ConfigurationTarget.Workspace);
  }

  private async updateCurrentLanguage(language: string) {
    const config = vscode.workspace.getConfiguration('compomint');
    await config.update('currentLanguage', language, vscode.ConfigurationTarget.Workspace);

    // Also update language in all active tab panels
    this.updateLanguageInAllTabPanels(language);
  }

  public updateLanguageInAllTabPanels(language: string) {

    this._activeTabPanels.forEach(panel => {
      panel.webview.postMessage({
        command: 'updateLanguage',
        language: language,
      });
    });
  }

  public reloadWebview() {
    if (this._view) {

      // Send updated resources to the webview
      const enabledResources = this._resourceProvider
        ? this._resourceProvider.getEnabledResources()
        : [];
      this._view.webview.postMessage({
        command: 'updateResources',
        resources: enabledResources,
      });
    }

    // Also reload all active tab panels
    this.reloadAllTabPanels();
  }

  public reloadAllTabPanels() {

    this._activeTabPanels.forEach(panel => {
      const templateData = (panel as any)._templateData;
      if (templateData) {
        // Get fresh resources
        const enabledResources = this._resourceProvider
          ? this._resourceProvider.getEnabledResources()
          : [];
        const cssResources = enabledResources.filter(r => r.type === 'css');
        const jsResources = enabledResources.filter(r => r.type === 'js');

        // Get library URL from configuration
        const config = vscode.workspace.getConfiguration('compomint');
        const libraryUrl = config.get<string>(
          'libraryUrl',
          'https://cdn.jsdelivr.net/gh/kurukona/compomint@latest/dist/compomint.esm.min.js'
        );

        // Regenerate HTML with updated resources
        const htmlContent = this.generateTabHtml(
          templateData.template,
          templateData.data,
          templateData.language,
          cssResources,
          jsResources,
          libraryUrl
        );

        panel.webview.html = htmlContent;

        panel.webview.postMessage({
          command: 'showTemplate',
          template: templateData.template,
        });
      }
    });
  }

  public async openTemplateInTab(template: any, data: string, language: string) {
    try {
      // Get enabled resources
      const enabledResources = this._resourceProvider
        ? this._resourceProvider.getEnabledResources()
        : [];
      const cssResources = enabledResources.filter(r => r.type === 'css');
      const jsResources = enabledResources.filter(r => r.type === 'js');

      // Get library URL from configuration
      const config = vscode.workspace.getConfiguration('compomint');
      const libraryUrl = config.get<string>(
        'libraryUrl',
        'https://cdn.jsdelivr.net/gh/kurukona/compomint@latest/dist/compomint.esm.min.js'
      );

      // Create HTML content for the new tab
      const htmlContent = this.generateTabHtml(
        template,
        data,
        language,
        cssResources,
        jsResources,
        libraryUrl
      );

      // Create a webview panel instead of a text document
      const panel = vscode.window.createWebviewPanel(
        'compomintTemplatePreview',
        `Template Preview: ${template.id}`,
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      // Store template data in panel for reloading
      (panel as any)._templateData = { template, data, language };

      // Add to active panels list
      this._activeTabPanels.push(panel);

      // Handle panel disposal
      panel.onDidDispose(() => {
        const index = this._activeTabPanels.indexOf(panel);
        if (index > -1) {
          this._activeTabPanels.splice(index, 1);
        }
      });

      panel.webview.html = htmlContent;

      panel.webview.postMessage({
        command: 'showTemplate',
        template: template,
      });

      vscode.window.showInformationMessage(`Template preview opened in new tab: ${template.id}`);
    } catch (error) {
      console.error('Error opening template in tab:', error);
      vscode.window.showErrorMessage(`Failed to open template in tab: ${error}`);
    }
  }

  private sendSampleDataToWebview(templateId: string) {
    const sampleData = getSampleDataForTemplate(templateId);

    if (this._view) {
      this._view.webview.postMessage({
        command: 'setSampleData',
        sampleData: sampleData,
      });
    }
  }

  private generateTabHtml(
    template: any,
    data: string,
    language: string,
    cssResources: any[],
    jsResources: any[],
    libraryUrl: string
  ): string {
    return `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compomint Template Preview - ${template.id}</title>
    ${cssResources
      .map(
        resource => `<link rel="stylesheet" href="${resource.url}" data-dynamic-resource="true">`
      )
      .join('\n    ')}
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 20px;
            background-color: #ffffff;
            color: #333333;
        }
        .template-info {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .template-name {
            font-size: 18px;
            font-weight: bold;
            color: #495057;
            margin-bottom: 5px;
        }
        .template-language {
            font-size: 14px;
            color: #6c757d;
        }
        .template-preview {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            background-color: #ffffff;
            width: 100%;
            height: 500px;
            resize: both;
            overflow: auto;
            box-sizing: border-box;
        }
        .size-controls {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .size-controls h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #495057;
        }
        .size-input-group {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 10px;
        }
        .size-input {
            width: 80px;
            padding: 5px 8px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 14px;
        }
        .size-button {
            padding: 6px 12px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .size-button:hover {
            background-color: #0056b3;
        }
        .preset-buttons {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
        }
        .preset-button {
            padding: 4px 8px;
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        .preset-button:hover {
            background-color: #545b62;
        }
        .error {
            color: #dc3545;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="template-info">
        <div class="template-name">${template.id}</div>
        <div class="template-language">Language: ${language.toUpperCase()}</div>
    </div>
    
    <div class="size-controls">
        <h3>Preview Size Controls</h3>
        <div class="size-input-group">
            <label>Width:</label>
            <input type="text" id="width-input" class="size-input" value="100%" placeholder="Width">
            <label>Height:</label>
            <input type="text" id="height-input" class="size-input" value="500" placeholder="Height">
            <button class="size-button" onclick="applySize()">Apply Size</button>
        </div>
        <div class="preset-buttons">
            <button class="preset-button" onclick="setPresetSize('300', '400')">300x400</button>
            <button class="preset-button" onclick="setPresetSize('500', '600')">500x600</button>
            <button class="preset-button" onclick="setPresetSize('800', '600')">800x600</button>
            <button class="preset-button" onclick="setPresetSize('1024', '768')">1024x768</button>
            <button class="preset-button" onclick="setPresetSize('100%', '500')">Full Width</button>
        </div>
    </div>
    
    <div class="template-preview" id="preview">
        <!-- Template will be rendered here -->
    </div>

    ${jsResources
      .map(resource => `<script src="${resource.url}" data-dynamic-resource="true"></script>`)
      .join('\n    ')}
    <script type="module">
        import { compomint } from '${libraryUrl}';


        let dataJson = \`${data
          .replace(/`/g, '\\`')
          .replace(/\$/g, '\\$')}\`.trim();        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'showTemplate':
                    const template = message.template;
                    rerenderTemplate(template);
                    break;
                case 'updateLanguage':
                    updateLanguage(message.language);
                    break;
            }
        });

        function updateLanguage(newLanguage) {
            // Update document language
            document.documentElement.lang = newLanguage;
            
            // Update language display in template info
            const languageDisplay = document.querySelector('.template-language');
            if (languageDisplay) {
                languageDisplay.textContent = \`Language: \${newLanguage.toUpperCase()}\`;
            }
            
            // Re-render the template with new language
            rerenderTemplate();
        }

        let currentTemplate = null;

        function rerenderTemplate(template) {
            try {
                // Parse template data again
                let templateData = {};

                if (template) {
                    currentTemplate = template;
                    compomint.addTmpl(template.id, template.content);
                }

                if (dataJson) {
                    try {
                        // Remove comments
                        const cleanJson = dataJson.replace(/\\/\\/.*$/gm, '').replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');
                        templateData = JSON.parse(cleanJson);
                    } catch (e) {
                        console.warn('Invalid JSON data, using empty object:', e);
                    }
                }

                // Re-render template
                const preview = document.getElementById('preview');
                if (preview && currentTemplate) {
                    // Clear existing content
                    preview.innerHTML = '';
                    
                    // Render template again
                    const component = compomint.tmpl(currentTemplate.id)(templateData);
                    preview.appendChild(component.element);
                }
            } catch (error) {
                console.error('Error re-rendering template:', error);
                const preview = document.getElementById('preview');
                if (preview) {
                    let errorMessage = \`Error re-rendering template: \${error.message}\`;
                    
                    // Add more detailed error information
                    if (error.stack) {
                        errorMessage += \`\\n\\nStack trace:\\n\${error.stack}\`;
                    }
                    
                    // Check for JSON parsing errors specifically
                    if (error instanceof SyntaxError && dataJson) {
                        errorMessage = \`JSON Parsing Error: \${error.message}\\n\\nPlease check your Template Data (JSON) syntax.\\n\\nCurrent JSON:\\n\${dataJson}\`;
                    }
                    
                    // Format the error message with better styling
                    const formattedMessage = errorMessage.replace(/\\n/g, '<br>').replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
                    
                    preview.innerHTML = \`
                        <div class="error" style="
                            border-left: 4px solid #dc3545; 
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
                            max-height: 300px; 
                            overflow-y: auto;
                            padding: 15px;
                        ">
                            <strong style="color: #dc3545; font-size: 16px;">🚫 Error</strong><br><br>
                            <div style="font-family: 'Courier New', monospace; font-size: 13px; white-space: pre-wrap;">\${formattedMessage}</div>
                        </div>
                    \`;
                }
            }
        }

        // Size control functions
        function applySize() {
            const widthInput = document.getElementById('width-input');
            const heightInput = document.getElementById('height-input');
            const preview = document.getElementById('preview');
            
            const width = widthInput.value;
            const height = heightInput.value;
            
            if (width) {
                preview.style.width = width.includes('%') || width.includes('px') ? width : width + 'px';
            }
            if (height) {
                preview.style.height = height.includes('%') || height.includes('px') ? height : height + 'px';
            }
        }

        function setPresetSize(width, height) {
            const widthInput = document.getElementById('width-input');
            const heightInput = document.getElementById('height-input');
            
            widthInput.value = width;
            heightInput.value = height;
            
            applySize();
        }

        // Initialize input values and resize observer
        document.addEventListener('DOMContentLoaded', function() {
            const preview = document.getElementById('preview');
            const widthInput = document.getElementById('width-input');
            const heightInput = document.getElementById('height-input');
            
            // Set initial values from preview element
            widthInput.value = '100%';
            heightInput.value = '500';
            
            // Add resize observer to track manual resizing
            if (window.ResizeObserver) {
                const resizeObserver = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        const { width, height } = entry.contentRect;
                        updateInputsFromResize(Math.round(width), Math.round(height));
                    }
                });
                
                resizeObserver.observe(preview);
            }
            
            // Fallback for browsers without ResizeObserver
            let resizeTimeout;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    const preview = document.getElementById('preview');
                    const rect = preview.getBoundingClientRect();
                    updateInputsFromResize(Math.round(rect.width), Math.round(rect.height));
                }, 100);
            });
            
            // Track mouse events for manual resize
            let isResizing = false;
            
            preview.addEventListener('mousedown', function(e) {
                // Check if mouse is near the resize handle (bottom-right corner)
                const rect = preview.getBoundingClientRect();
                const isNearHandle = e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20;
                if (isNearHandle) {
                    isResizing = true;
                }
            });
            
            document.addEventListener('mouseup', function() {
                if (isResizing) {
                    isResizing = false;
                    // Update inputs after resize is complete
                    setTimeout(() => {
                        const preview = document.getElementById('preview');
                        const rect = preview.getBoundingClientRect();
                        updateInputsFromResize(Math.round(rect.width), Math.round(rect.height));
                    }, 50);
                }
            });
        });

        function updateInputsFromResize(width, height) {
            const widthInput = document.getElementById('width-input');
            const heightInput = document.getElementById('height-input');
            
            if (widthInput && heightInput) {
                // Only update if values have actually changed
                const currentWidth = widthInput.value;
                const currentHeight = heightInput.value;
                
                const newWidth = width + 'px';
                const newHeight = height + 'px';
                
                if (currentWidth !== newWidth) {
                    widthInput.value = newWidth;
                }
                if (currentHeight !== newHeight) {
                    heightInput.value = newHeight;
                }
                
            }
        }

        // Make functions globally available
        window.applySize = applySize;
        window.setPresetSize = setPresetSize;
        window.updateInputsFromResize = updateInputsFromResize;
    </script>
</body>
</html>`;
  }

  private updatePreview() {
    if (this._view && this.currentTemplate) {
      this._view.webview.postMessage({
        command: 'showTemplate',
        template: {
          id: this.currentTemplate.templateId,
          content: this.currentTemplate.content,
        },
      });
    }
  }

  private _getHtmlForWebview(_webview: vscode.Webview) {
    const enabledResources = this._resourceProvider
      ? this._resourceProvider.getEnabledResources()
      : [];
    const cssResources = enabledResources.filter(r => r.type === 'css');
    const jsResources = enabledResources.filter(r => r.type === 'js');

    const config = vscode.workspace.getConfiguration('compomint');
    const availableLanguages = config.get<string[]>('availableLanguages', ['en', 'ko', 'ja', 'zh']);
    const currentLanguage = config.get<string>(
      'currentLanguage',
      config.get<string>('currentLanguage', 'en')
    );
    const libraryUrl = config.get<string>(
      'libraryUrl',
      'https://cdn.jsdelivr.net/gh/kurukona/compomint@latest/dist/compomint.esm.min.js'
    );

    return `<!DOCTYPE html>
<html lang="${currentLanguage}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compomint Template Preview</title>
    ${cssResources
      .map(
        resource => `<link rel="stylesheet" href="${resource.url}" data-dynamic-resource="true">`
      )
      .join('\n    ')}
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 10px;
            margin: 0;
        }
        .no-template {
            color: var(--vscode-descriptionForeground);
            text-align: center;
            margin-top: 20px;
        }
        .template-info {
            margin-bottom: 10px;
            padding: 10px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
        }
        .template-name {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        .data-editor {
            margin: 10px 0;
        }
        .data-editor label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .data-editor textarea {
            width: 100%;
            min-height: 100px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            padding: 5px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            resize: vertical;
        }
        .render-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 14px;
            border-radius: 2px;
            cursor: pointer;
            font-size: var(--vscode-font-size);
        }
        .render-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .preview-container {
            margin-top: 20px;
            padding: 10px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            background-color: var(--vscode-editor-background);
        }
        .error {
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
            border-left: 4px solid var(--vscode-errorForeground);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-height: 300px;
            overflow-y: auto;
        }
        .error strong {
            color: var(--vscode-errorForeground);
            font-size: calc(var(--vscode-font-size) + 1px);
        }
        .sample-data-selector {
            margin: 10px 0;
        }
        .sample-data-selector label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .sample-data-selector select {
            width: 100%;
            padding: 6px 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
        }
        .sample-data-actions {
            margin-top: 5px;
            display: flex;
            gap: 10px;
        }
        .load-sample-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 12px;
            border-radius: 2px;
            cursor: pointer;
            font-size: calc(var(--vscode-font-size) - 1px);
        }
        .load-sample-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
    </style>
</head>
<body>
    <div id="content">
        <div class="no-template">
            <p>Select a template from the Templates view to preview it here.</p>
        </div>
    </div>

    ${jsResources
      .map(resource => `<script src="${resource.url}" data-dynamic-resource="true"></script>`)
      .join('\n    ')}
    <script type="module">

        import { compomint, tmpl } from '${libraryUrl}';

        const vscode = acquireVsCodeApi();
        let currentTemplate = null;
        
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'showTemplate':
                    showTemplate(message.template);
                    break;
                case 'updateLanguageSettings':
                    updateLanguageSelect(message.availableLanguages, message.currentLanguage);
                    break;
                case 'updateResources':
                    updateDynamicResources(message.resources);
                    break;
                case 'setSampleData':
                    setSampleDataForTemplate(message.sampleData);
                    break;
                default:
            }
        });

        function renderTemplate() {
            if (!currentTemplate) return;
            
            const dataTextarea = document.getElementById('template-data');
            const languageSelect = document.getElementById('language-select');
            const preview = document.getElementById('preview');
            const errorContainer = document.getElementById('error-container');
            
            // Clear previous errors
            errorContainer.innerHTML = '';
            
            try {
                // Update document language
                const selectedLanguage = languageSelect.value;
                document.documentElement.lang = selectedLanguage;
                
                // Update Compomint language
                if (typeof compomint.setLang === 'function') {
                    compomint.setLang(selectedLanguage);
                }
                
                // Parse template data
                const dataJson = dataTextarea.value.trim();
                let data = {};
                if (dataJson) {
                    // Remove comments
                    const cleanJson = dataJson.replace(/\\/\\/.*$/gm, '').replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');
                    data = JSON.parse(cleanJson);
                }
                
                // Render template
                preview.innerHTML = '';
                const component = compomint.tmpl(currentTemplate.id)(data);
                preview.appendChild(component.element);
                
            } catch (err) {
                let errorMessage = \`Error rendering template: \${err.message}\`;
                
                // Add more detailed error information
                if (err.stack) {
                    errorMessage += \`\n\nStack trace:\n\${err.stack}\`;
                }
                
                // Check for JSON parsing errors specifically
                if (err instanceof SyntaxError && dataJson) {
                    errorMessage = \`JSON Parsing Error: \${err.message}\n\n\${err}\n\nPlease check your Template Data (JSON) syntax.\n\nCurrent JSON:\n\${dataJson}\`;
                }
                
                showError(errorMessage);
                
                // Also clear the preview to avoid showing outdated content
                preview.innerHTML = \`<div style="color: var(--vscode-errorForeground); padding: 20px; text-align: center;">
                    <strong>Template rendering failed</strong><br>
                    See error details above.
                </div>\`;
            }
        }

        function openTemplateInTab() {
            if (!currentTemplate) return;
            
            const dataTextarea = document.getElementById('template-data');
            const languageSelect = document.getElementById('language-select');
            
            // Get current template data and language
            const templateData = dataTextarea.value.trim();
            const selectedLanguage = languageSelect.value;
            
            // Send message to extension to open template in new tab
            vscode.postMessage({
                command: 'openTemplateInTab',
                template: currentTemplate,
                data: templateData,
                language: selectedLanguage
            });
        }

        function updateDynamicResources(resources) {
            
            // Remove existing dynamic resources
            const existingCss = document.querySelectorAll('link[data-dynamic-resource]');
            const existingJs = document.querySelectorAll('script[data-dynamic-resource]');
            
            existingCss.forEach(link => link.remove());
            existingJs.forEach(script => script.remove());
            
            // Add new resources
            const head = document.head;
            
            resources.forEach(resource => {
                if (resource.type === 'css') {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = resource.url;
                    link.setAttribute('data-dynamic-resource', 'true');
                    head.appendChild(link);
                } else if (resource.type === 'js') {
                    const script = document.createElement('script');
                    script.src = resource.url;
                    script.setAttribute('data-dynamic-resource', 'true');
                    head.appendChild(script);
                }
            });
            
        }

        function showError(message) {
            const errorContainer = document.getElementById('error-container');
            
            // Format the error message with better styling
            const formattedMessage = message.replace(/\\n/g, '<br>').replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
            
            errorContainer.innerHTML = \`
                <div class="error">
                    <strong>🚫 Error</strong><br><br>
                    <div style="font-family: var(--vscode-editor-font-family); font-size: calc(var(--vscode-font-size) - 1px); white-space: pre-wrap;">\${formattedMessage}</div>
                    <br>
                    <button onclick="this.parentElement.style.display='none'" 
                            style="background: var(--vscode-button-secondaryBackground); 
                                   color: var(--vscode-button-secondaryForeground); 
                                   border: none; 
                                   padding: 4px 8px; 
                                   border-radius: 2px; 
                                   cursor: pointer; 
                                   font-size: calc(var(--vscode-font-size) - 2px);">
                        Dismiss
                    </button>
                </div>
            \`;
            
            // Send error to extension
            vscode.postMessage({
                command: 'error',
                text: message
            });
        }

        function showTemplate(template) {
            currentTemplate = template;
            
            // Initialize Compomint with the template
            try {
                compomint.addTmpl(template.id, template.content);
            } catch (err) {
                console.error('Error initializing template:', err);
                showError(\`Error initializing template: \${err.message}\`);
                return;
            }

            // Request sample data for this template
            vscode.postMessage({
                command: 'getSampleData',
                templateId: template.id
            });

            // Update UI
            document.getElementById('content').innerHTML = \`
                <div class="template-info">
                    <span class="template-name">\${template.id}</span>
                </div>
                
                <div class="sample-data-selector" id="sample-data-container" style="display: none;">
                    <label for="sample-data-select">Sample Data:</label>
                    <select id="sample-data-select">
                        <option value="">Select sample data...</option>
                    </select>
                    <div class="sample-data-actions">
                        <button id="load-sample-btn" class="load-sample-button">Load Selected Data</button>
                    </div>
                </div>
                
                <div class="data-editor">
                    <label for="template-data">Template Data (JSON):</label>
                    <textarea id="template-data">{
    "title": "Example Title",
    "content": "Example content",
    "items": []
}</textarea>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div style="display: flex; gap: 5px;">
                        <button id="render-btn" class="render-button">Render Template</button>
                        <button id="open-tab-btn" class="render-button" style="background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);">Template Preview</button>
                    </div>
                    <select id="language-select" style="padding: 6px; background-color: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;">
                        ${availableLanguages
                          .map(lang => `<option value="${lang}">${lang.toUpperCase()}</option>`)
                          .join('')}
                    </select>
                </div>
                
                <div id="error-container"></div>
                
                <div class="preview-container">
                    <div id="preview">
                        <p style="color: var(--vscode-descriptionForeground);">
                            Click "Render Template" to see the preview
                        </p>
                    </div>
                </div>
            \`;

            const lang = document.documentElement.lang;
            const languageSelect = document.getElementById('language-select');
            languageSelect.value = lang;

            document.getElementById('render-btn').addEventListener('click', renderTemplate);
            document.getElementById('open-tab-btn').addEventListener('click', openTemplateInTab);
            
            // Add event listener for sample data loading
            document.getElementById('load-sample-btn').addEventListener('click', function() {
                const sampleSelect = document.getElementById('sample-data-select');
                const selectedIndex = sampleSelect.selectedIndex;
                if (selectedIndex > 0) { // Skip the first "Select sample data..." option
                    const selectedData = window.currentSampleData[selectedIndex - 1];
                    if (selectedData) {
                        const dataTextarea = document.getElementById('template-data');
                        dataTextarea.value = JSON.stringify(selectedData.data, null, 2);
                        // Optionally trigger render automatically
                        renderTemplate();
                    }
                }
            });
            
            // Add event listener for language change
            document.getElementById('language-select').addEventListener('change', function() {
                const selectedLanguage = this.value;
                
                // Update document language immediately
                document.documentElement.lang = selectedLanguage;
                
                // Update Compomint language
                if (typeof compomint.setLang === 'function') {
                    compomint.setLang(selectedLanguage);
                }
                
                // Save language setting to workspace settings
                vscode.postMessage({
                    command: 'updateLanguage',
                    language: selectedLanguage
                });
                
                // Re-render template if one is loaded
                if (currentTemplate) {
                    renderTemplate();
                }
            });
        }

        function setSampleDataForTemplate(sampleData) {
            
            // Store sample data globally for access by event handlers
            window.currentSampleData = sampleData;
            
            const sampleContainer = document.getElementById('sample-data-container');
            const sampleSelect = document.getElementById('sample-data-select');
            
            if (sampleData && sampleData.length > 0) {
                // Clear existing options except the first one
                sampleSelect.innerHTML = '<option value="">Select sample data...</option>';
                
                // Add options for each sample data
                sampleData.forEach((sample, index) => {
                    const option = document.createElement('option');
                    option.value = index.toString();
                    option.textContent = sample.description || \`Sample \${index + 1}\`;
                    sampleSelect.appendChild(option);
                });
                
                // Show the sample data selector
                sampleContainer.style.display = 'block';
            } else {
                // Hide the sample data selector if no data
                sampleContainer.style.display = 'none';
            }
        }

        function updateLanguageSelect(availableLanguages, currentLanguage) {
            const languageSelect = document.getElementById('language-select');
            if (languageSelect) {
                languageSelect.innerHTML = availableLanguages.map(lang => 
                    \`<option value="\${lang}" \${lang === currentLanguage ? 'selected' : ''}>\${lang.toUpperCase()}</option>\`
                ).join('');
                
                // Update document language
                document.documentElement.lang = currentLanguage;
                
                // Update Compomint language
                if (typeof compomint.setLang === 'function') {
                    compomint.setLang(currentLanguage);
                }
            }
        }

        // Notify extension that webview is ready
        vscode.postMessage({ command: 'ready' });
    </script>
</body>
</html>`;
  }
}

// Resource view provider for managing CSS/JS resources
class CompomintResourceProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'compomint.resourcesView';

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _previewProvider?: CompomintPreviewProvider
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.command) {
        case 'updateResources':
          this.updateResources(data.resources);
          break;
        case 'ready':
          this.loadCurrentResources();
          break;
      }
    });
  }

  public getEnabledResources(): any[] {
    const config = vscode.workspace.getConfiguration('compomint');
    const resources = config.get<any[]>('resources', []);
    const enabledResources = resources.filter(resource => resource.enabled);
    return enabledResources;
  }

  private async updateResources(resources: any[]) {
    const config = vscode.workspace.getConfiguration('compomint');
    await config.update('resources', resources, vscode.ConfigurationTarget.Workspace);

    // Reload preview webview to apply new resources
    if (this._previewProvider) {
      this._previewProvider.reloadWebview();
    }
  }

  private loadCurrentResources() {
    const config = vscode.workspace.getConfiguration('compomint');
    const resources = config.get<any[]>('resources', []);

    if (this._view) {
      this._view.webview.postMessage({
        command: 'loadResources',
        resources,
      });
    }
  }

  private _getHtmlForWebview(_webview: vscode.Webview) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compomint Resources</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 10px;
            margin: 0;
        }
        .resource-list {
            margin-bottom: 15px;
        }
        .resource-item {
            display: flex;
            align-items: center;
            padding: 8px;
            margin-bottom: 5px;
            background-color: var(--vscode-list-inactiveSelectionBackground);
            border-radius: 4px;
        }
        .resource-checkbox {
            margin-right: 8px;
        }
        .resource-info {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .resource-name {
            font-weight: bold;
            margin-bottom: 2px;
        }
        .resource-url {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            word-break: break-all;
        }
        .resource-type {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.8em;
            margin-left: 8px;
        }
        .add-resource {
            margin-bottom: 15px;
            padding: 10px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
        }
        .input-group {
            margin-bottom: 10px;
        }
        .input-group label {
            display: block;
            margin-bottom: 3px;
            font-weight: bold;
        }
        .input-group input, .input-group select {
            width: 100%;
            padding: 4px 6px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            box-sizing: border-box;
        }
        .button-group {
            display: flex;
            gap: 5px;
        }
        .btn {
            padding: 6px 12px;
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: var(--vscode-font-size);
        }
        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .delete-btn {
            background-color: transparent;
            color: var(--vscode-errorForeground);
            border: none;
            cursor: pointer;
            padding: 4px;
            margin-left: 4px;
        }
        .delete-btn:hover {
            background-color: var(--vscode-inputValidation-errorBackground);
        }
        .no-resources {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            margin: 20px 0;
        }
    </style>
</head>
<body>

    <div class="resource-list" id="resource-list">
        <div class="no-resources">No resources added yet.</div>
    </div>

    <div class="add-resource">
        <div class="input-group">
            <label for="resource-name">Name:</label>
            <input type="text" id="resource-name" placeholder="Bootstrap CSS">
        </div>
        <div class="input-group">
            <label for="resource-url">URL:</label>
            <input type="text" id="resource-url" placeholder="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css">
        </div>
        <div class="input-group">
            <label for="resource-type">Type:</label>
            <select id="resource-type">
                <option value="css">CSS</option>
                <option value="js">JavaScript</option>
            </select>
        </div>
        <div class="button-group">
            <button class="btn btn-primary" onclick="addResource()">Add Resource</button>
            <button class="btn btn-secondary" onclick="clearForm()">Clear</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let resources = [];
        
        // Load current resources
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'loadResources':
                    resources = message.resources || [];
                    renderResources();
                    break;
            }
        });
        
        function addResource() {
            const name = document.getElementById('resource-name').value.trim();
            const url = document.getElementById('resource-url').value.trim();
            const type = document.getElementById('resource-type').value;
            
            if (!url) {
                return;
            }
            
            const resource = {
                name: name || \`\${type.toUpperCase()} Resource\`,
                url: url,
                type: type,
                enabled: true
            };
            
            resources.push(resource);
            updateResources();
            clearForm();
        }
        
        function clearForm() {
            document.getElementById('resource-name').value = '';
            document.getElementById('resource-url').value = '';
            document.getElementById('resource-type').selectedIndex = 0;
        }
        
        function toggleResource(index) {
            const checkbox = event.target;
            resources[index].enabled = checkbox.checked;
            updateResources();
        }
        
        function deleteResource(index) {
            resources.splice(index, 1);
            updateResources();
        }
        
        function updateResources() {
            vscode.postMessage({
                command: 'updateResources',
                resources: resources
            });
        }
        
        function renderResources() {
            const container = document.getElementById('resource-list');
            
            if (resources.length === 0) {
                container.innerHTML = '<div class="no-resources">No resources added yet.</div>';
                return;
            }
            
            container.innerHTML = resources.map((resource, index) => \`
                <div class="resource-item">
                    <input type="checkbox" class="resource-checkbox" 
                           \${resource.enabled ? 'checked' : ''} 
                           onchange="toggleResource(\${index})">
                    <div class="resource-info">
                        <div class="resource-name">\${resource.name}</div>
                        <div class="resource-url">\${resource.url}</div>
                    </div>
                    <span class="resource-type">\${resource.type.toUpperCase()}</span>
                    <button class="delete-btn" onclick="deleteResource(\${index})" title="Delete resource">✕</button>
                </div>
            \`).join('');
        }
        
        // Handle Enter key in inputs
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
                addResource();
            }
        });
        
        // Notify extension that webview is ready
        vscode.postMessage({ command: 'ready' });
    </script>
</body>
</html>`;
  }
}

// Filter view provider for template filtering
class CompomintFilterProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'compomint.filterView';

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _templateProvider: CompomintTemplateProvider
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.command) {
        case 'updateFilter':
          this.updateFilter(data.fileExtensions, data.templateIdFilter);
          break;
        case 'updateSettings':
          this.updateSettings(data.enableValidation, data.enableSyntaxHighlighting);
          break;
        case 'ready':
          this.loadCurrentSettings();
          break;
      }
    });
  }

  private async updateFilter(fileExtensions: string, templateIdFilter: string) {
    const config = vscode.workspace.getConfiguration('compomint');

    // Update configuration
    await config.update(
      'fileExtensionFilter',
      fileExtensions,
      vscode.ConfigurationTarget.Workspace
    );
    await config.update('templateIdFilter', templateIdFilter, vscode.ConfigurationTarget.Workspace);

    // Refresh templates
    this._templateProvider.refresh();
  }

  private async updateSettings(enableValidation: boolean, enableSyntaxHighlighting: boolean) {
    const config = vscode.workspace.getConfiguration('compomint');

    // Update configuration
    await config.update('enableValidation', enableValidation, vscode.ConfigurationTarget.Workspace);
    await config.update(
      'enableSyntaxHighlighting',
      enableSyntaxHighlighting,
      vscode.ConfigurationTarget.Workspace
    );

    console.log('Settings updated:', {
      enableValidation,
      enableSyntaxHighlighting,
    });
  }

  private loadCurrentSettings() {
    const config = vscode.workspace.getConfiguration('compomint');
    const fileExtensions = config.get<string>('fileExtensionFilter', 'html,htm');
    const templateIdFilter = config.get<string>('templateIdFilter', '');
    const enableValidation = config.get<boolean>('enableValidation', true);
    const enableSyntaxHighlighting = config.get<boolean>('enableSyntaxHighlighting', true);

    if (this._view) {
      this._view.webview.postMessage({
        command: 'loadSettings',
        fileExtensions,
        templateIdFilter,
        enableValidation,
        enableSyntaxHighlighting,
      });
    }
  }

  private _getHtmlForWebview(_webview: vscode.Webview) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compomint Filter</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 10px;
            margin: 0;
        }
        .filter-group {
            margin-bottom: 15px;
        }
        .filter-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: var(--vscode-foreground);
        }
        .filter-group input {
            width: 100%;
            padding: 6px 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            box-sizing: border-box;
        }
        .filter-group input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        .help-text {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-top: 3px;
        }
        .apply-button {
            width: 100%;
            padding: 8px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: var(--vscode-font-size);
            margin-top: 10px;
        }
        .apply-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .reset-button {
            width: 100%;
            padding: 6px;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: var(--vscode-font-size);
            margin-top: 5px;
        }
        .reset-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
    </style>
</head>
<body>

    <div class="filter-group">
        <label>Features:</label>
        <div style="margin-top: 5px;">
            <div style="margin-bottom: 8px;">
                <label style="display: flex; align-items: center; font-weight: normal; cursor: pointer;">
                    <input type="checkbox" id="enable-validation" style="width: 20px; margin: 0 8px 0 0;">
                    Enable Template Validation
                </label>
            </div>
            <div>
                <label style="display: flex; align-items: center; font-weight: normal; cursor: pointer;">
                    <input type="checkbox" id="enable-syntax-highlighting" style="width: 20px; margin: 0 8px 0 0;">
                    Enable Syntax Highlighting
                </label>
            </div>
        </div>
        <div class="help-text">Toggle Compomint features on/off</div>
    </div>

    <div class="filter-group">
        <label for="file-extensions">File Extensions:</label>
        <input type="text" id="file-extensions" placeholder="html,htm,php">
        <div class="help-text">Comma-separated list (e.g., html,htm,php)</div>
    </div>
    
    <div class="filter-group">
        <label for="template-id">Template ID Filter:</label>
        <input type="text" id="template-id" placeholder="compo-*,mint-*-Card">
        <div class="help-text">Patterns with wildcards (e.g., compo-*, *-button)</div>
    </div>
    
    <button class="apply-button" onclick="applyFilter()">Apply Filter</button>
    <button class="reset-button" onclick="resetFilter()">Reset</button>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Apply filter
        function applyFilter() {
            const fileExtensions = document.getElementById('file-extensions').value.trim();
            const templateIdFilter = document.getElementById('template-id').value.trim();
            
            vscode.postMessage({
                command: 'updateFilter',
                fileExtensions: fileExtensions || 'html,htm',
                templateIdFilter: templateIdFilter
            });
        }
        
        // Apply settings
        function applySettings() {
            const enableValidation = document.getElementById('enable-validation').checked;
            const enableSyntaxHighlighting = document.getElementById('enable-syntax-highlighting').checked;
            
            vscode.postMessage({
                command: 'updateSettings',
                enableValidation: enableValidation,
                enableSyntaxHighlighting: enableSyntaxHighlighting
            });
        }
        
        // Reset filter
        function resetFilter() {
            document.getElementById('file-extensions').value = 'html,htm';
            document.getElementById('template-id').value = '';
            document.getElementById('enable-validation').checked = true;
            document.getElementById('enable-syntax-highlighting').checked = true;
            applyFilter();
            applySettings();
        }
        
        // Load current settings
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'loadSettings':
                    document.getElementById('file-extensions').value = message.fileExtensions;
                    document.getElementById('template-id').value = message.templateIdFilter;
                    document.getElementById('enable-validation').checked = message.enableValidation;
                    document.getElementById('enable-syntax-highlighting').checked = message.enableSyntaxHighlighting;
                    break;
            }
        });
        
        // Add change listeners for checkboxes
        document.addEventListener('DOMContentLoaded', function() {
            const validationCheckbox = document.getElementById('enable-validation');
            const syntaxCheckbox = document.getElementById('enable-syntax-highlighting');
            
            validationCheckbox.addEventListener('change', applySettings);
            syntaxCheckbox.addEventListener('change', applySettings);
        });
        
        // Apply filter on Enter key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                applyFilter();
            }
        });
        
        // Notify extension that webview is ready
        vscode.postMessage({ command: 'ready' });
    </script>
</body>
</html>`;
  }
}

// Generate template content based on template type
function generateTemplateContent(templateType: string, templateId: string): string {
  switch (templateType) {
    case 'Simple Template':
      return `<template id="${templateId}">
  ##
    // This is the main JavaScript block. Code here runs during template rendering.
    // Write your component logic here
    
  ##
  <div class="${templateId}">
    ##* This is the HTML structure of the component. ##
    
  </div>
</template>`;

    case 'Basic Template':
      return `<template id="${templateId}">
  <style id="style-${templateId}">
    .${templateId} {
      /* Add your styles here */

    }
  </style>
  ##
    // This is the main JavaScript block. Code here runs during template rendering.
    // Write your component logic here

  ##
  <div class="${templateId}">
    ##* This is the HTML structure of the component. ##
    
  </div>
</template>`;

    case 'I18n Template':
      return `<template id="${templateId}">
  <style id="style-${templateId}">
    .${templateId} {
      /* Add your styles here */

    }
  </style>
  ##!
    // This is the pre-evaluation block. Code here runs before the template is rendered.
    compomint.addI18ns({
      // Define your internationalization strings here.
      '${templateId}': {
        'title': {
          'en': 'Title',
          'ja': 'タイトル',
          'ko': '제목',
          'zh': '标题'
        }
      }
    });
  ##
  ##
    // This is the main JavaScript block. Code here runs during template rendering.
    // Write your component logic here
    
  ##
  <div class="${templateId}">
    ##* This is the HTML structure of the component. ##
    
  </div>
</template>`;

    case 'Comprehensive Template':
      return `<template id="${templateId}">
  <style id="style-${templateId}">
    .${templateId} {
      /* Add your styles here */

    }
  </style>
  ##!
    // This is the pre-evaluation block. Code here runs before the template is rendered.
    compomint.addI18ns({
      // Define your internationalization strings here.
      '${templateId}': {
        'title': {
          'en': 'Title',
          'ja': 'タイトル',
          'ko': '제목',
          'zh': '标题'
        }
      }
    });
  ##
  ##
    // This is the main JavaScript block. Code here runs during template rendering.
    // Write your component logic here
    
  ##
  <div class="${templateId}">
    ##* This is the HTML structure of the component. ##
    
  </div>
  ###
    // Code that runs after render. Write your post-render code here.
    
  ##
</template>`;

    default:
      return generateTemplateContent('Basic Template', templateId);
  }
}

// Sample data extraction and management functions
interface SampleData {
  templateId: string;
  data: any;
  description?: string;
  metadata?: {
    title?: string;
    category?: string;
    tags?: string[];
    author?: string;
    version?: string;
    [key: string]: any;
  };
}

// Extract metadata from comment text
function extractMetadataFromComment(commentText: string): any {
  const metadata: any = {};
  
  // Extract metadata using @key: value pattern
  const metadataRegex = /@(\w+):\s*(.+?)(?=\n@|\n[^@]|$)/g;
  let match;
  
  while ((match = metadataRegex.exec(commentText)) !== null) {
    const key = match[1];
    const value = match[2].trim();
    
    // Handle special cases
    if (key === 'tags') {
      // Split tags by comma and trim each tag
      metadata[key] = value.split(',').map(tag => tag.trim());
    } else {
      metadata[key] = value;
    }
  }
  
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

// Extract sample data from HTML comments
function extractSampleDataFromComment(commentText: string, fullCommentText?: string): SampleData | null {
  let jsonString = '';
  let templateId = '';

  try {
    // Find template function call pattern: tmpl.type.ComponentName({...})
    // More flexible regex to handle multiline objects and various spacing
    const templateCallMatch = commentText.match(/tmpl\.[\w\.]+\(\s*(\{[\s\S]*?\})\s*\)/);
    if (!templateCallMatch) {
      return null;
    }

    // Extract the template ID from the function call
    const templateIdMatch = commentText.match(/tmpl\.([\w\.]+)\(/);
    if (!templateIdMatch) {
      return null;
    }

    templateId = templateIdMatch[1];
    jsonString = templateCallMatch[1];

    // Clean up the JSON string for better parsing
    jsonString = jsonString.trim();

    // Parse the JavaScript object using Function constructor for better compatibility
    const data = Function(`"use strict"; return (${jsonString});`)();

    // Generate a more descriptive description based on the data
    const generateDescription = (templateId: string, data: any): string => {
      const parts = [templateId];

      // Add key characteristics of the data
      if (data.label) {
        parts.push(`label: "${data.label}"`);
      }
      if (data.title) {
        parts.push(`title: "${data.title}"`);
      }
      if (data.content) {
        const content =
          data.content.length > 30 ? data.content.substring(0, 30) + '...' : data.content;
        parts.push(`content: "${content}"`);
      }
      if (data.items && Array.isArray(data.items)) {
        parts.push(`${data.items.length} items`);
      }

      return parts.join(' - ');
    };

    // Extract metadata if fullCommentText is provided
    let metadata: any = undefined;
    if (fullCommentText) {
      metadata = extractMetadataFromComment(fullCommentText);
    }

    return {
      templateId,
      data,
      description: generateDescription(templateId, data),
      metadata,
    };
  } catch (error) {
    console.error(
      `Error parsing sample data from comment for template '${templateId}':`,
      error,
      'JSON string:',
      jsonString
    );
    return null;
  }
}

// Find all HTML comments containing sample data in a document
function findSampleDataInDocument(document: vscode.TextDocument): SampleData[] {
  const text = document.getText();
  const sampleDataList: SampleData[] = [];

  // 1. Find HTML comments with Sample keyword
  const htmlCommentRegex = /<!--\s*(Sample|sample)\s*([\s\S]*?)-->/gi;
  let match;

  while ((match = htmlCommentRegex.exec(text)) !== null) {
    const fullCommentText = match[0]; // Full comment including "Sample" keyword
    const commentText = match[2].trim();

    // Check if comment contains template function call
    if (commentText.includes('tmpl.') && commentText.includes('({')) {
      const sampleData = extractSampleDataFromComment(commentText, fullCommentText);
      if (sampleData) {
        sampleDataList.push(sampleData);
      }
    }
  }

  // 2. Find Compomint comments with Sample keyword (##* Sample ... ##)
  const compomintCommentRegex = /##\*\s*(Sample|sample)\s*([\s\S]*?)##/gi;
  
  while ((match = compomintCommentRegex.exec(text)) !== null) {
    const fullCommentText = match[0]; // Full comment including "Sample" keyword
    const commentText = match[2].trim();

    // Check if comment contains template function call
    if (commentText.includes('tmpl.') && commentText.includes('({')) {
      const sampleData = extractSampleDataFromComment(commentText, fullCommentText);
      if (sampleData) {
        sampleDataList.push(sampleData);
      }
    }
  }


  return sampleDataList;
}

// Global sample data storage
const sampleDataStorage = new Map<string, SampleData[]>();


// Get sample data for a template
function getSampleDataForTemplate(templateId: string): SampleData[] {
  return sampleDataStorage.get(templateId) || [];
}

// Scan workspace for sample data
async function scanWorkspaceForSampleData() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return;
  }

  const fileExtensions = getFileExtensions();
  const patterns = fileExtensions.map(ext => `**/*.${ext}`);

  for (const pattern of patterns) {
    const files = await vscode.workspace.findFiles(pattern);

    for (const file of files) {
      try {
        const document = await vscode.workspace.openTextDocument(file);
        const sampleDataList = findSampleDataInDocument(document);

        // Group by template ID
        const groupedData = new Map<string, SampleData[]>();
        for (const sampleData of sampleDataList) {
          const existing = groupedData.get(sampleData.templateId) || [];
          existing.push(sampleData);
          groupedData.set(sampleData.templateId, existing);
        }

        // Update storage - store both dot notation and dash notation
        for (const [templateId, data] of groupedData) {
          sampleDataStorage.set(templateId, data); // example.OrderSummary

          // Also store with dash notation for HTML template IDs
          const dashNotation = templateId.replace(/\./g, '-'); // example-OrderSummary
          sampleDataStorage.set(dashNotation, data);
        }
      } catch (error) {
        console.error('Error processing file for sample data:', file.path, error);
      }
    }
  }
}

export function deactivate() {
  // Clean up decorators
  Object.values(compomintDecorators).forEach(decorator => decorator.dispose());
}
