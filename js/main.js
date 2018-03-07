/*//////////////////////////////////////////////////////////////////////////////
-                                   MENU                                       -
//////////////////////////////////////////////////////////////////////////////*/
let menu = document.querySelector('#menu');

/*```````````````````````````````````new``````````````````````````````````````*/
function removeCurrentDialog() {
  let dialog = document.querySelector('.dialog');
  if (dialog) dialog.remove();
}

let newButton = document.createElement('button');
newButton.textContent = 'new';
newButton.style.width = '60px';
newButton.addEventListener('click', showNewDialog);
menu.appendChild(newButton);

function showNewDialog() {
  removeCurrentDialog();

  info.textContent = 'please enter width and height in cells';

  let dialog = document.createElement('span');
  dialog.className = 'dialog';

  let widthField = document.createElement('input');
  widthField.className = 'field';
  dialog.appendChild(document.createTextNode(' width: '));
  dialog.appendChild(widthField);

  let heightField = document.createElement('input');
  heightField.className = 'field';
  dialog.appendChild(document.createTextNode(' height: '));
  dialog.appendChild(heightField);
  dialog.appendChild(document.createTextNode(' '))

  let ok = document.createElement('button');
  ok.textContent = '🗸';
  ok.addEventListener('click', confirmNew);
  dialog.appendChild(ok);

  let no = document.createElement('button');
  no.textContent = '✗';
  no.addEventListener('click', removeCurrentDialog);
  dialog.appendChild(no);

  menu.appendChild(dialog);
}

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
let openButton = document.createElement('button');
openButton.textContent = 'open';
openButton.style.width = '60px';
openButton.addEventListener('click', showOpenDialog);
menu.appendChild(openButton);

function showOpenDialog() {
  removeCurrentDialog();

  info.textContent = 'please paste a level string to parse';

  let dialog = document.createElement('span');
  dialog.className = 'dialog';

  dialog.appendChild(document.createTextNode(' level: '));

  let textField = document.createElement('textarea');
  textField.className = 'field';
  dialog.appendChild(textField);
  dialog.appendChild(document.createTextNode(' '));

  let ok = document.createElement('button');
  ok.textContent = '🗸';
  ok.addEventListener('click', confirmOpen);
  dialog.appendChild(ok);

  let no = document.createElement('button');
  no.textContent = '✗';
  no.addEventListener('click', removeCurrentDialog);
  dialog.appendChild(no);

  menu.appendChild(dialog);
}

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
let copyButton = document.createElement('button');
copyButton.textContent = 'copy';
copyButton.style.width = '60px';
copyButton.addEventListener('click', copyLevel);
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
-                           PALETTE & EDITING TOOL                             -
//////////////////////////////////////////////////////////////////////////////*/
const PALETTE = {
  '.': {color: 'rgb(52, 166, 251)', help: 'empty'},
  '#': {color: 'rgb(255, 255, 255)', help: 'wall'},
  '@': {color: 'rgb(64, 64, 64)', help: 'player'},
  'o': {color: 'rgb(241, 229, 89)', help: 'coin'},
  '+': {color: 'rgb(255, 100, 100)', help: 'lava'},
  '=': {color: 'rgb(255, 100, 100)', help: 'moving lava (horizontal)'},
  '|': {color: 'rgb(255, 100, 100)', help: 'moving lava (vertical)'},
  'v': {color: 'rgb(255, 100, 100)', help: 'dripping lava'}
};
const TOOLS = [brush, fill];
let mouseTool = {tool: brush, char: '.', color: 'rgb(52, 166, 251)'};
function applyEdit(cell) {
  cell.textContent = mouseTool.char;
  cell.style.backgroundColor = mouseTool.color;
  if (cell.style.backgroundColor == 'rgb(255, 255, 255)') {
    cell.style.color = 'rgb(64, 64, 64)';
  }
  else {
    cell.style.color = 'rgb(255, 255, 255)';
  }
}
function brush(event) {
  if (event.buttons == 1) {
    applyEdit(event.target);
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
    let startCell = event.target;
    let startY = rows.indexOf(startCell.parentNode);
    let startX = grid[startY].indexOf(startCell);

    let width = grid[0].length, height = grid.length;
    let targetChar = startCell.textContent;
    let queue = [{cell: startCell, x: startX, y: startY}];

    function flood(cell, x, y) {
      if (cell.textContent != targetChar) return ;
      for (let westX = x; westX >= 0; westX--) {
        let currentNeighbor = grid[y][westX];
        if (currentNeighbor.textContent == targetChar) {
          applyEdit(currentNeighbor);
          if (y > 0 && grid[y - 1][westX].textContent == targetChar) {
            queue.push({cell: grid[y - 1][westX], x: westX, y: y - 1});
          }
          if (y < width - 1 && grid[y + 1][westX].textContent == targetChar) {
            queue.push({cell: grid[y + 1][westX], x: westX, y: y + 1});
          }
        }
        else break;
      }
      for (let eastX = x + 1; eastX < width; eastX++) {
        let currentNeighbor = grid[y][eastX];
        if (currentNeighbor.textContent == targetChar) {
          applyEdit(currentNeighbor);
          if (y > 0  &&  grid[y - 1][eastX].textContent == targetChar) {
            queue.push({cell: grid[y - 1][eastX], x: eastX, y: y - 1});
          }
          if (y < width - 1 && grid[y + 1][eastX].textContent == targetChar) {
            queue.push({cell: grid[y + 1][eastX], x: eastX, y: y + 1});
          }
        }
        else break;
      }
    }

    for (let {cell, x, y} of queue) {
      flood(cell, x, y);
    }
  }
}
/*//////////////////////////////////////////////////////////////////////////////
-                                 TOOLBAR                                      -
//////////////////////////////////////////////////////////////////////////////*/
let toolbar = document.querySelector('#toolbar');

function annotate(button) {
  button.addEventListener('mouseenter', () => {
    info.textContent = button.getAttribute('data-help');
  });
}

/*................................tool buttons................................*/
let toolPanel = document.createElement('div');
toolPanel.style.paddingBottom = '1px';
let toolButtons = [];

for (let tool of TOOLS) {
  let button = document.createElement('button');
  button.className = 'tool';
  button.functionTool = tool;
  button.setAttribute('data-help', `${tool.name} tool`);
  button.textContent = tool.name.slice(0, 2);
  annotate(button);
  button.addEventListener('click', toolSelect);
  toolButtons.push(button);
  toolPanel.appendChild(button);
}
toolbar.appendChild(toolPanel)

function toolSelect(event) {
  let button = event.target;
  toolButtons.forEach(b => b.className = 'tool');
  button.className = 'tool selected';
  mouseTool.tool = button.functionTool;
}

/*..............................palette buttons...............................*/
let chars = Object.keys(PALETTE);
let paletteButtons = [];
let palettePanel = document.createElement('div');
palettePanel.style.borderTop = '1px solid rgb(64, 64, 64)';
palettePanel.style.borderBottom = palettePanel.style.borderTop
palettePanel.style.paddingTop = '1px';
palettePanel.style.paddingBottom = palettePanel.style.paddingTop;
let row = document.createElement('div');
for (let i = 0; i < chars.length; i++) {
  let char = chars[i];
  let button = document.createElement('button');
  button.className = 'palette';
  button.setAttribute('data-help', PALETTE[char].help);
  annotate(button);
  button.textContent = char;
  button.addEventListener('click', paletteSelect);
  paletteButtons.push(button);
  row.appendChild(button);

  if ((i + 1) % 4 == 0) {
    palettePanel.appendChild(row);
    row = document.createElement('div');
  }
}
toolbar.appendChild(palettePanel);

function paletteSelect(event) {
  let button = event.target;
  paletteButtons.forEach(b => b.className = 'palette');
  button.className = 'palette selected';
  mouseTool.char = button.textContent;
  mouseTool.color = PALETTE[mouseTool.char].color;
}

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
  Array.from(document.querySelectorAll('#view > div'))
    .forEach(div => div.remove());
  for (let y = 0; y < height; y++) {
    let row = document.createElement('div');
    for (let x = 0; x < width; x++) {
      let cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = '.';
      cell.style.left = `${x * 20}px`;
      cell.style.top = `${y * 20}px`;
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
showOpenDialog();
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
