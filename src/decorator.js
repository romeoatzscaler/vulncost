import { workspace, window, Range, Position, ThemeColor } from 'vscode';
import logger from './logger';

const decorations = {};

export function flushDecorations(fileName, packages) {
  // logger.log(`Flushing decorations`);
  decorations[fileName] = {};
  packages.forEach(packageInfo => {
    if (packageInfo.vulns === undefined) {
      const configuration = workspace.getConfiguration('vulnCost');
      if (configuration.showDecoration) {
        decorate('Scanning for vulns...', packageInfo);
      }
    } else {
      calculated(packageInfo);
    }
  });
  refreshDecorations(fileName);
}

export function calculated(packageInfo) {
  const decorationMessage = getDecorationMessage(packageInfo);
  decorate(decorationMessage, packageInfo);
}

function getDecorationMessage(packageInfo) {
  logger.log(
    `getDecorationMessage - has object? ${!!packageInfo}, has prop? ${!!packageInfo.vulns}, for ${
      packageInfo.name
    }`
  );
  if (!packageInfo.vulns || !packageInfo.vulns.count) {
    return '';
  }

  const { count } = packageInfo.vulns;
  let decorationMessage = `${count} vuln${count === 1 ? '' : 's'}`;

  return decorationMessage;
}

function decorate(text, packageInfo) {
  const { fileName, line } = packageInfo;

  const hasVuln = text.includes('vuln');

  let color = new ThemeColor(hasVuln ? 'errorForeground' : 'foreground');

  let fontWeight = hasVuln ? 'bold' : 'normal';

  decorations[fileName][line] = {
    renderOptions: { after: { contentText: text, color, fontWeight } },
    range: new Range(
      new Position(line - 1, 1024),
      new Position(line - 1, 1024)
    ),
  };
  refreshDecorations(fileName);
}

const decorationType = window.createTextEditorDecorationType({
  after: { margin: '0 0 0 1rem' },
});
let decorationsDebounce;
function refreshDecorations(fileName, delay = 10) {
  clearTimeout(decorationsDebounce);
  decorationsDebounce = setTimeout(
    () =>
      getEditors(fileName).forEach(editor => {
        editor.setDecorations(
          decorationType,
          Object.keys(decorations[fileName]).map(x => decorations[fileName][x])
        );
      }),
    delay
  );
}

function getEditors(fileName) {
  return window.visibleTextEditors.filter(
    editor => editor.document.fileName === fileName
  );
}

export function clearDecorations() {
  window.visibleTextEditors.forEach(textEditor => {
    return textEditor.setDecorations(decorationType, []);
  });
}
