// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('JSON Visualizer extension is now active!');

	const disposable = vscode.commands.registerCommand('jsonvisualizer.openPreview', () => {
		const activeEditor = vscode.window.activeTextEditor;
		
		if (!activeEditor || path.extname(activeEditor.document.fileName) !== '.json') {
			vscode.window.showErrorMessage('Please open a JSON file first');
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'jsonVisualizer',
			'JSON Visualizer',
			vscode.ViewColumn.Beside,
			{
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.file(path.join(context.extensionPath, 'out', 'webview'))
				]
			}
		);

		const scriptPath = vscode.Uri.file(
			path.join(context.extensionPath, 'out', 'webview', 'bundle.js')
		);
		const scriptUri = panel.webview.asWebviewUri(scriptPath);

		panel.webview.html = `
			<!DOCTYPE html>
			<html>
				<head>
					<meta charset="UTF-8">
					<title>JSON Visualizer</title>
					<style>
						body {
							margin: 0;
							padding: 0;
							height: 100vh;
							width: 100vw;
							background: #1A1A1A;
						}
						#root {
							height: 100%;
							width: 100%;
                            font-family: Menlo, Monaco, Consolas, monospace;
						}
					</style>
				</head>
				<body>
					<div id="root"></div>
					<script>
						window.vscodeApi = acquireVsCodeApi();
					</script>
					<script src="${scriptUri}"></script>
				</body>
			</html>
		`;

		// JSON içeriğini gönder
		const updateContent = () => {
			const jsonContent = activeEditor.document.getText();
			panel.webview.postMessage({
				type: 'update',
				content: jsonContent
			});
		};

		updateContent();

		// Dosya değişikliklerini izle
		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(event => {
			if (event.document === activeEditor.document) {
				updateContent();
			}
		});

		// Panel kapandığında event listener'ı temizle
		panel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		}, null, context.subscriptions);
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
