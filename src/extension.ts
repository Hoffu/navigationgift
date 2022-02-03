import * as fs from 'fs';
import path = require('path');
import * as vscode from 'vscode';
import { NavigationProvider, TreeItem } from './navigation';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "navigationgift" is now active!');
	const navigationProvider = new NavigationProvider(textAdaptaion(""));
    updateTreeView(navigationProvider);
	vscode.window.registerTreeDataProvider('navigation', navigationProvider);
	const goToLineCommand = vscode.commands.registerCommand('navigationgift.goToLine', (item: TreeItem) => {
		const editor = vscode.window.activeTextEditor;
		if(editor) {
			const range = editor.document.lineAt(item.line - 1).range;
			editor.revealRange(range);
			editor.selection = new vscode.Selection(range.start, range.end);
		}
	});
	context.subscriptions.push(goToLineCommand);
	vscode.window.onDidChangeTextEditorSelection(() => updateTreeView(navigationProvider));

	const mergeFilesCommandName = 'navigationgift.mergeFiles';
	const mergeFilesCommand = vscode.commands.registerCommand(mergeFilesCommandName, () => {
		const editor = vscode.window.activeTextEditor;
		let newText: string = "";
		vscode.workspace.textDocuments.map((openDoc) => {
			newText += openDoc.getText();
			newText.trim();
			newText += "\n";
		});
		if(editor) {
			editor.edit((editBuilder) => {
				let firstLine = editor.document.lineAt(0);
				let lastLine = editor.document.lineAt(editor.document.lineCount - 1);
				let range = new vscode.Range(firstLine.range.start, lastLine.range.end);
				editBuilder.replace(range, newText);
			});
			updateTreeView(navigationProvider);
			vscode.window.showInformationMessage('Files merged successfully.');
		}
	});
	context.subscriptions.push(mergeFilesCommand);
	const mergeFilesButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 120);
	mergeFilesButton.command = mergeFilesCommandName;
	mergeFilesButton.text = `$(files) Merge open GIFT files`;
	mergeFilesButton.show();
	context.subscriptions.push(mergeFilesButton);

	let count = 0;
	const vcsCommandName = 'navigationgift.saveFile';
	const vcsCommand = vscode.commands.registerCommand(vcsCommandName, () => {
		vscode.window.showInformationMessage('( ͡° ͜ʖ ͡°)');
		const activeEditor = vscode.window.activeTextEditor;
		if(activeEditor) {
			const content = activeEditor.document.getText();
			const filePath = path.join(activeEditor.document.fileName.replace(new RegExp('.gift\$'), '')
				+ '_' + count++ + '.gift');
			fs.writeFileSync(filePath, content, 'utf8');
		}
	});
	context.subscriptions.push(vcsCommand);
	const vcsButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 130);
	vcsButton.command = vcsCommandName;
	vcsButton.text = `$(clone) Save current version`;
	vcsButton.show();
	context.subscriptions.push(vcsButton);
}

export function deactivate() {}

function textAdaptaion(documentText: string): Map<number, string> {
	let splitted = documentText.split(/\n\s*\n/);
	splitted = splitted.map(
		(capture) => capture.split(/\n/)
			.filter((line) => !line.startsWith('//'))
			.reduce((section, line) => section + '\n' + line, '')
			.trim()
	);
	splitted = splitted.filter((capture) => capture !== '');

	let linesAndQuestions = new Map();
	documentText.split(/\n/).forEach((line, i) => {
		for(let n = 0; n < splitted.length; n++) {
			if(line.startsWith(splitted[n]) || splitted[n].startsWith(line)) {
				linesAndQuestions.set(i + 1, splitted[n]
					.replace(/{[\s\S]*}/, '___')
					.replace(/___$/, '')
					.replace(/(?<=::[\s\S]*::)[\s\S]*/, '')
					.replace(/::/g, '')
				);
				splitted.splice(n, 1);
				break;
			}
		}
	});
	return linesAndQuestions;
}

function updateTreeView(navigationProvider: NavigationProvider): void {
	const activeEditor = vscode.window.activeTextEditor;
	if(activeEditor) {
		navigationProvider.updateData(textAdaptaion(activeEditor.document.getText()));
		navigationProvider.refresh();
	}
}
