import * as vscode from 'vscode';
import { NavigationProvider, TreeItem } from './navigation';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "navigationgift" is now active!');
	const editor = assembleTreeDataProvider();

	const disposable = vscode.commands.registerCommand('navigationgift.goToLine', (item: TreeItem) => {
        if(editor) {
			const range = editor.document.lineAt(item.line - 1).range;
			editor.revealRange(range);
			editor.selection = new vscode.Selection(range.start, range.end);
		}
    });
    context.subscriptions.push(disposable);

	vscode.window.onDidChangeTextEditorSelection(() => assembleTreeDataProvider());

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
				vscode.window.showInformationMessage('Files merged successfully.');
			});
		}
	});
	context.subscriptions.push(mergeFilesCommand);

	const mergeFilesButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	mergeFilesButton.command = mergeFilesCommandName;
	mergeFilesButton.text = `$(files) Merge open GIFT files`;
	mergeFilesButton.show();
	context.subscriptions.push(mergeFilesButton);
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

function assembleTreeDataProvider(): vscode.TextEditor | undefined {
	const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
		vscode.window.registerTreeDataProvider('navigation', new NavigationProvider(textAdaptaion(document.getText())));
    }
	return editor;
}
