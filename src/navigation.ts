import * as vscode from 'vscode';

export class NavigationProvider implements vscode.TreeDataProvider<TreeItem> {
  onDidChangeTreeData?: vscode.Event<TreeItem|null|undefined>|undefined;

  data: TreeItem[] = [];

  constructor(headers: Map<number, string>) {
    const categoriesLines: number[] = [];
    headers.forEach((capture, line) => {
      if(capture.startsWith('$CATEGORY:')) {
        categoriesLines.push(line);
      }
    });

    if(categoriesLines.length != 0) {
      headers.forEach((capture, line) => {
        if(line < categoriesLines[0]) this.data.push(new TreeItem(capture, line));
      });

      for(let i = 0; i < categoriesLines.length; i++) {
        let items: TreeItem[] = [];
        let arr: number[] = Array.from(headers.keys());
        let endBorder = (i == categoriesLines.length - 1) ? arr[arr.length - 1] + 1 : categoriesLines[i + 1];
        headers.forEach((capture, line) => {
          if(line > categoriesLines[i] && line < endBorder) {
            items.push(new TreeItem(capture, line));
          }
        });
        let header: any = headers.get(categoriesLines[i]);
        this.data.push(new TreeItem(header.replace('$CATEGORY: ', ''), categoriesLines[i], items));
      }
    } else {
      headers.forEach((capture, line) => this.data.push(new TreeItem(capture, line)));
    }
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

export class TreeItem extends vscode.TreeItem {
  children: TreeItem[]|undefined;
  line: number;

  command = {
    "title": "Go to line",
    "command": "navigationgift.goToLine",
    "arguments": [this]
  }

  constructor(label: string, line: number, children?: TreeItem[]) {
    super(
        label,
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                 vscode.TreeItemCollapsibleState.Expanded);
    this.children = children;
    this.line = line;
  }
}