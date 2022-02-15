import * as vscode from 'vscode';

export class NavigationProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  data: TreeItem[] = [];

  constructor(headers: Map<number, string>) {
    this.updateData(headers);
  }

  refresh(): void {
		this._onDidChangeTreeData.fire();
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

  updateData(headers: Map<number, string>): void {
    if(headers.size != 0) {
      let categoriesLines = this.searchForCategories(headers);
      if(categoriesLines.size != 0) {
        categoriesLines = this.searchForEndLines(categoriesLines, headers);
        
        const array = Array.from(categoriesLines.keys());
        headers.forEach((capture, line) => {
          if(line < array[0][0]) this.data.push(new TreeItem(capture, line));
        });

        this.writeData(categoriesLines, headers);
      } else {
        headers.forEach((capture, line) => this.data.push(new TreeItem(capture, line)));
      }
    }
  }

  searchForCategories(headers: Map<number, string>): Map<number[], string> {
    this.data = [];
    const categoriesLines = new Map<number[], string>();
    headers.forEach((capture, lines) => {
      if(capture.startsWith('$CATEGORY:')) {
        categoriesLines.set([lines], capture);
      }
    });
    return categoriesLines;
  }

  searchForEndLines(categoriesLines: Map<number[], string>, headers: Map<number, string>): Map<number[], string> {
    let endLines: number[] = [];
    categoriesLines.forEach((capture, lines) => endLines.push(lines[0] - 1));
    endLines.shift();
    const arr: number[] = Array.from(headers.keys());
    endLines.push(arr[arr.length - 1] + 1);
    categoriesLines.forEach((capture, lines) => {
      let endLine = endLines.shift();
      if(endLine) lines.push(endLine);
    });
    return categoriesLines;
  }

  writeData(categoriesLines: Map<number[], string>, headers: Map<number, string>): void {
    categoriesLines.forEach((category, linesOfCategory) => {
      if(category.split('/').length == 1) {
        let categories: TreeItem[] = [];
        categoriesLines.forEach((capture, lines) => {
          if(capture.startsWith(category) && linesOfCategory != lines) {
            let items: TreeItem[] = this.getLowLevelTreeItemsArray(lines, headers, []);
            categories.push(new TreeItem(capture.replace('$CATEGORY: ', ''), lines[0], items));
          } else if(capture.startsWith(category)) {
            categories = this.getLowLevelTreeItemsArray(lines, headers, categories);
          }
        });
        this.data.push(new TreeItem(category.replace('$CATEGORY: ', ''), linesOfCategory[0], categories));
      } else {
        let count = 0;
        categoriesLines.forEach((capture, lines) => {
          if(capture.startsWith(category.split('/')[0])) count++;
        });
        if(count == 1) {
          let items: TreeItem[] = this.getLowLevelTreeItemsArray(linesOfCategory, headers, []);
          this.data.push(new TreeItem(category.replace('$CATEGORY: ', ''), linesOfCategory[0], items));
        }
      }
    });
  }

  getLowLevelTreeItemsArray(lines: number[], headers: Map<number, string>, items: TreeItem[]): TreeItem[] {
    for(let i = lines[0] + 1; i < lines[1]; i++) {
      let header = headers.get(i);
      if(header) items.push(new TreeItem(header, i));
    }
    return items;
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