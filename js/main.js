/*==============================================================================
.                                                                              .
.                                 WARNING                                      .
.   I am extremely new to all of this, so the code below is certainly not      .
.   even close to being a good way to achieve any of the things I wanted,      .
.   and is instead mostly a mess of spaghetti and hacky workarounds.           .
.   (The same obviously goes for the other parts of this project)              .
.                                                                              .
==============================================================================*/
/*==============================================================================
.                                                                              .
.                             ANOTHER WARNING                                  .
.   There are very few comments (two, to be precise), and I don't feel         .
.   like many are needed for any single section of the code, but if the        .
.   bigger picture seems obscure, please refer to the project's wiki,          .
.   you will find a brief overview of how things fit together there.           .
.                                                                              .
==============================================================================*/
/*//////////////////////////////////////////////////////////////////////////////
-                                   MENU                                       -
//////////////////////////////////////////////////////////////////////////////*/
function showDialog(fields, confirm, help = '') {
  removeCurrentDialog();

  let dialog = document.createElement('span');
  dialog.className = 'dialog';

  for (let {type, description} of fields) {
    let field = document.createElement(type);
    field.className = 'field';
    dialog.appendChild(document.createTextNode(` ${description} `));
    dialog.appendChild(field);
  }
  dialog.appendChild(document.createTextNode(' '));

  let yes = createButton(
    {'innerHTML': '<i class="material-icons md-18">check</i>'},
    confirm
  );
  dialog.appendChild(yes);

  let no = createButton(
    {'innerHTML': '<i class="material-icons md-18">close</i>'},
    removeCurrentDialog
  );
  dialog.appendChild(no);

  info.textContent = help;
  menu.appendChild(dialog);
}
function removeCurrentDialog() {
  let dialog = document.querySelector('.dialog');
  if (dialog) dialog.remove();
}

function createButton(label, onClick, className = '', help) {
  let button = document.createElement('button');
  button.className = className;
  Object.assign(button, label); // textContent or innerHTML

  if (help) {
    button.setAttribute('data-help', help);
    button.addEventListener('mouseenter', () => {
      info.textContent = button.getAttribute('data-help');
    });
  }
  button.addEventListener('click', onClick);
  return button;
}

let menu = document.querySelector('#menu');

/*```````````````````````````````````new``````````````````````````````````````*/
let newButton = createButton({'textContent': 'new'}, () => showDialog(
  [
    {type: 'input', description: 'width'},
    {type: 'input', description: 'height'}
  ],
  confirmNew, 'please enter width and height in cells'
));
menu.appendChild(newButton);

function confirmNew() {
  let fields = document.querySelectorAll('.field');
  let width = Number(fields[0].value);
  let height = Number(fields[1].value);
  if (!isNaN(width) && !isNaN(height)) {
    removeCurrentDialog();
    renderView(width, height);
  }
}

/*`````````````````````````````````open``````````````````````````````````````*/
let openButton = createButton({'textContent': 'open'}, () => showDialog(
  [{type: 'textarea', description: 'level'}],
  confirmOpen, 'please paste a level string to parse'
));
menu.appendChild(openButton);

function confirmOpen() {
  let level = document.querySelector('textarea').value.trim().split('\n');
  for (let i = 0; i < level.length - 2; i++) {
    if (level[i].length != level[i + 1].length) {
      info.textContent = 'error: irregular grid detected';
      return;
    }
  }

  removeCurrentDialog();
  renderView(level[0].length, level.length);

  let cells = Array.from(document.querySelectorAll('.cell'));
  let content = level.join('');

  try {
    cells.forEach((cell, i) => {
      let char = content[i];
      if (!PALETTE.hasOwnProperty(char)) {
        throw new Error(`error: invalid character: '${char}'`);
      }
      if (char == '#') cell.style.color = 'rgb(64, 64, 64)';
      cell.textContent = char;
      cell.style.backgroundColor = PALETTE[char].color;
    });
  }
  catch (e) {
    info.textContent = e.message;
    return;
  }
  info.textContent = 'level parsed successfully';
}

/*`````````````````````````````````copy``````````````````````````````````````*/
let copyButton = createButton({'textContent': 'copy'}, copyLevel);
menu.appendChild(copyButton);
function copyLevel() {
  let level = '';
  let cells = Array.from(document.querySelectorAll('.cell'));
  let width = document.querySelector('#view > div').childNodes.length;
  cells.forEach((cell, i) => {
    level += cell.textContent;
    if ((i + 1) % width == 0) level += '\n';
  });
  info.textContent = level;
  info.select();
  document.execCommand('Copy');
  info.textContent = 'level copied to clipboard';
}

/*//////////////////////////////////////////////////////////////////////////////
-                          PALETTE & EDITING TOOLS                             -
//////////////////////////////////////////////////////////////////////////////*/
const PALETTE = {
  '.': {color: 'rgb(52, 166, 251)', help: 'empty'},
  '#': {color: 'rgb(255, 255, 255)', help: 'wall'},
  '@': {color: 'rgb(64, 64, 64)', help: 'player'},
  'o': {color: 'rgb(241, 229, 89)', help: 'coin'},
  '+': {color: 'rgb(255, 100, 100)', help: 'lava'},
  '=': {color: 'rgb(255, 100, 100)', help: 'moving lava (horizontal)'},
  '|': {color: 'rgb(255, 100, 100)', help: 'moving lava (vertical)'},
  'v': {color: 'rgb(255, 100, 100)', help: 'dripping lava'},
  'M': {color: 'rgb(128, 0, 128)', help: 'monster'}
};
const TOOLS = [
  {tool: brush, icon: 'brush'},
  {tool: fill, icon: 'format_color_fill'}
];

let mouseTool = {tool: brush, char: '.'};

function applyEdit(cell, char) {
  cell.textContent = char;
  cell.style.backgroundColor = PALETTE[char].color;
  if (cell.style.backgroundColor == 'rgb(255, 255, 255)') {
    cell.style.color = 'rgb(64, 64, 64)';
  }
  else {
    cell.style.color = 'rgb(255, 255, 255)';
  }
}
function brush(event) {
  if (event.buttons == 1 && mouseTool.char != event.target.textContent) {
    let cell = event.target;
    updateHistory([cell], cell.textContent);
    applyEdit(cell, mouseTool.char);
  }
}

function fill(event) {
  if (
    event.buttons == 1 &&
    event.type == 'mousedown' &&
    mouseTool.char != event.target.textContent
  ) {
    let rows = Array.from(view.children);
    let grid = rows.map(row => Array.from(row.children));
    let width = grid[0].length, height = grid.length;

    let startCell = event.target;
    let startY = rows.indexOf(startCell.parentNode);
    let startX = grid[startY].indexOf(startCell);

    let targetChar = startCell.textContent;
    let queue = [{cell: startCell, x: startX, y: startY}];
    let changed = [];

    function flood(cell, x, y) {
      if (cell.textContent != targetChar) return ;
      for (let westX = x; westX >= 0; westX--) {
        let currentNeighbor = grid[y][westX];
        if (currentNeighbor.textContent == targetChar) {
          applyEdit(currentNeighbor, mouseTool.char);
          changed.push(currentNeighbor);
          if (y > 0 && grid[y - 1][westX].textContent == targetChar) {
            queue.push({cell: grid[y - 1][westX], x: westX, y: y - 1});
          }
          if (y < height - 1 && grid[y + 1][westX].textContent == targetChar) {
            queue.push({cell: grid[y + 1][westX], x: westX, y: y + 1});
          }
        }
        else break;
      }
      for (let eastX = x + 1; eastX < width; eastX++) {
        let currentNeighbor = grid[y][eastX];
        if (currentNeighbor.textContent == targetChar) {
          applyEdit(currentNeighbor, mouseTool.char);
          changed.push(currentNeighbor);
          if (y > 0  &&  grid[y - 1][eastX].textContent == targetChar) {
            queue.push({cell: grid[y - 1][eastX], x: eastX, y: y - 1});
          }
          if (y < height - 1 && grid[y + 1][eastX].textContent == targetChar) {
            queue.push({cell: grid[y + 1][eastX], x: eastX, y: y + 1});
          }
        }
        else break;
      }
    }

    for (let {cell, x, y} of queue) {
      flood(cell, x, y);
    }
    updateHistory(changed, targetChar);
  }
}

/*//////////////////////////////////////////////////////////////////////////////
-                                 TOOLBAR                                      -
//////////////////////////////////////////////////////////////////////////////*/
let toolbar = document.querySelector('#toolbar');

/*................................tool buttons................................*/
let toolPanel = document.createElement('div');
toolPanel.style.paddingBottom = '1px';
let toolButtons = [];

for (let {tool, icon} of TOOLS) {
  let button = createButton(
    {'innerHTML': `<i class="material-icons">${icon}</i>`},
    () => {
      toolButtons.forEach(b => b.className = 'tool');
      button.className = 'tool selected';
      mouseTool.tool = tool;
    },
    'tool', `${tool.name}`
  );
  toolButtons.push(button);
  toolPanel.appendChild(button);
}
toolbar.appendChild(toolPanel);

/*..............................palette buttons...............................*/
let chars = Object.keys(PALETTE);
let paletteButtons = [];
let palettePanel = document.createElement('div');
palettePanel.style.borderTop = '1px solid rgb(64, 64, 64)';
palettePanel.style.borderBottom = palettePanel.style.borderTop;
palettePanel.style.paddingTop = '1px';
palettePanel.style.paddingBottom = palettePanel.style.paddingTop;
for (let i = 0, row = document.createElement('div'); i < chars.length; i++) {
  let char = chars[i];
  let button = createButton({'textContent': char}, () => {
    paletteButtons.forEach(b => b.className = 'palette');
    button.className = 'palette selected';
    mouseTool.char = button.textContent;
  }, 'palette', PALETTE[char].help);

  paletteButtons.push(button);
  row.appendChild(button);

  if ((i + 1) % 4 == 0 || i == chars.length - 1) {
    palettePanel.appendChild(row);
    row = document.createElement('div');
  }
}
toolbar.appendChild(palettePanel);

/*//////////////////////////////////////////////////////////////////////////////
-                                  UNDO/REDO                                   -
//////////////////////////////////////////////////////////////////////////////*/
class HistoryStack {
  constructor() {
    this._stack = []; //[{[cell, ...], char}, ...]
  }
  push(record) {
    this._stack.push(record);
    document.dispatchEvent(HistoryStack.updateEvent());
  }
  pop() {
    let record = this._stack.pop()
    document.dispatchEvent(HistoryStack.updateEvent());
    return record;
  }
  clear() {
    this._stack = [];
    document.dispatchEvent(HistoryStack.updateEvent());
  }
  drop(last) {
    this._stack = this._stack.slice(0, last);
    document.dispatchEvent(HistoryStack.updateEvent());
  }
  get length() { return this._stack.length; }

  static updateEvent() { return new CustomEvent('historyupdate'); }
}

let past = new HistoryStack, future = new HistoryStack;

function updateHistory(cells, char) {
  future.clear();
  if (past.length > 1000) past.drop(500);
  past.push({cells, char});
}
function clearHistory() {
  future.clear();
  past.clear();
}

function undo() {
  if (!past.length) return;
  let record = past.pop();
  future.push({cells: record.cells, char: record.cells[0].textContent});
  record.cells.forEach(cell => applyEdit(cell, record.char));
}
function redo() {
  if(!future.length) return;
  let record = future.pop();
  past.push({cells: record.cells, char: record.cells[0].textContent});
  record.cells.forEach(cell => applyEdit(cell, record.char));
}

window.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key == 'z') {
    undo();
  }
});
window.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key == 'y') {
    redo();
  }
});

let undoButton = createButton(
  {'innerHTML': '<i class="material-icons">undo</i>'},
  undo, 'edit', 'undo (ctrl/cmd + z)'
);
undoButton.disabled = true;
toolPanel.appendChild(undoButton);

let redoButton = createButton(
  {'innerHTML': '<i class="material-icons">redo</i>'},
  redo, 'edit', 'redo (ctrl/cmd + y)'
);
redoButton.disabled = true;
toolPanel.appendChild(redoButton);

document.addEventListener('historyupdate', () => {
  if (past.length) undoButton.disabled = false;
  else undoButton.disabled = true;
  if (future.length) redoButton.disabled = false;
  else redoButton.disabled = true;
});

/*//////////////////////////////////////////////////////////////////////////////
-                            INFORMATION/FEEDBACK                              -
//////////////////////////////////////////////////////////////////////////////*/
let infoPanel = document.createElement('div');
infoPanel.style.paddingTop = '1px';
let info = document.createElement('textarea');
info.className = 'info';
info.rows = 3;
info.readOnly = true;
infoPanel.appendChild(info);
toolbar.appendChild(infoPanel);

/*//////////////////////////////////////////////////////////////////////////////
-                                   VIEW                                       -
//////////////////////////////////////////////////////////////////////////////*/
let view = document.querySelector('#view');
view.style.left = `${toolbar.getBoundingClientRect().right + 8}px`;
function renderView(width, height) {
  clearHistory();
  Array.from(document.querySelectorAll('#view > div'))
    .forEach(div => div.remove());
  for (let y = 0; y < height; y++) {
    let row = document.createElement('div');
    for (let x = 0; x < width; x++) {
      let cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = '.';
      cell.addEventListener('mousedown', edit);
      cell.addEventListener('mouseover', edit);
      row.appendChild(cell);
    }
    view.appendChild(row);
  }
}
function edit(event) {
  mouseTool.tool(event);
}

/*//////////////////////////////////////////////////////////////////////////////
-                                INITIAL SETUP                                 -
//////////////////////////////////////////////////////////////////////////////*/
openButton.dispatchEvent(new MouseEvent('click'));
document.querySelector('.field').value = `
######################
#@@@ooo@o@@@ooo==o==o#
#@ooooo@o@oooo|++v++|#
#@ooooo@o@oooo|+++++|#
#@@oooo@o@@@oo|+++++|#
#@ooooo@ooo@ooo|+++|o#
#@ooooo@ooo@oooo|+|oo#
#@@@o@@@o@@@ooooovooo#
######################`;
confirmOpen();
toolButtons[0].dispatchEvent(new MouseEvent('click'));
paletteButtons[1].dispatchEvent(new MouseEvent('click'));
info.textContent = 'I am a small level editor for the EJS platformer project!';
