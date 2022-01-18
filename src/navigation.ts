import * as vscode from 'vscode';

export class NavigationProvider implements vscode.TreeDataProvider<TreeItem> {
  onDidChangeTreeData?: vscode.Event<TreeItem|null|undefined>|undefined;

  data: TreeItem[];

  constructor(documentText: String) {
    let splitted = documentText.split(/\n\s*\n/);
    splitted = splitted.map(
        (capture) => capture.split(/\n/)
            .filter((line) => !line.startsWith('//'))
            .reduce((section, line) => section + '\n' + line, '')
            .trim()
    );
    splitted = splitted.filter((capture) => capture !== '');
    splitted = splitted.map(
        (capture) => capture
            .replace(/{[\s\S]*}/, '___')
            .replace(/___$/, '')
            .replace(/(?<=::[\s\S]*::)[\s\S]*/, '')
            .replace(/::/g, '')
    );
    splitted.forEach((capture, i) => console.log(`Capture #${i}:\n${capture}`));
    this.data = [];
    splitted.forEach((capture) => this.data.push(new TreeItem(capture)));



    //Artificial data, for testing only

    // this.data = [new TreeItem('cars', [
    //   new TreeItem(
    //       'Ford', [new TreeItem('Fiesta'), new TreeItem('Focus'), new TreeItem('Mustang')]),
    //   new TreeItem(
    //       'BMW', [new TreeItem('320'), new TreeItem('X3'), new TreeItem('X5')])
    // ])];
  }

  getTreeItem(element: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: TreeItem|undefined): vscode.ProviderResult<TreeItem[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }
}

class TreeItem extends vscode.TreeItem {
  children: TreeItem[]|undefined;

  command = {
    "title": "Go to line",
    "command": "navigationgift.goToLine",
  }

  constructor(label: string, children?: TreeItem[]) {
    super(
        label,
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                 vscode.TreeItemCollapsibleState.Expanded);
    this.children = children;
  }
}