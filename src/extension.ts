import * as vscode from 'vscode';
import { NavigationProvider } from './navigation';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "navigationgift" is now active!');
	const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
		vscode.window.registerTreeDataProvider('navigation', new NavigationProvider(document.getText()));
    }

	const disposable = vscode.commands.registerCommand('navigationgift.goToLine', () => {
        if(editor) {
			const range = editor.document.lineAt(99).range;
			editor.revealRange(range);
			editor.selection = new vscode.Selection(range.start, range.start);
		}
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
