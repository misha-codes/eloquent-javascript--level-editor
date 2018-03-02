/*//////////////////////////////////////////////////////////////////////////////
-                                   VIEW                                       -
//////////////////////////////////////////////////////////////////////////////*/
function renderView(width, height) {
  Array.from(document.querySelectorAll('#view > div'))
    .forEach(div => div.remove());
  let view = document.querySelector('#view');
  for (let y = 0; y < height; y++) {
    let row = document.createElement('div');
    for (let x = 0; x < width; x++) {
      let cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = '.';
      cell.style.left = `${x * 20}px`;
      cell.style.top = `${y * 20}px`;
      cell.addEventListener('mousedown', draw);
      cell.addEventListener('mouseover', draw);
      row.appendChild(cell);
    }
    view.appendChild(row);
  }
}
function draw(event) {
  if (event.buttons == 1) {
    let cell = event.target;
    cell.textContent = brush.char;
    cell.style.backgroundColor = brush.color;
    if (cell.style.backgroundColor == 'rgb(255, 255, 255)') {
      cell.style.color = 'rgb(64, 64, 64)';
    }
    else {
      cell.style.color = 'rgb(255, 255, 255)';
    }
  }
}

/*//////////////////////////////////////////////////////////////////////////////
-                             PALETTE & BRUSH                                  -
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
let brush = {char: '.', color: 'grey'};

/*//////////////////////////////////////////////////////////////////////////////
-                                 GUI BUTTONS                                  -
//////////////////////////////////////////////////////////////////////////////*/
let gui = document.querySelector('#gui');

/*..............................palette buttons...............................*/
let chars = Object.keys(PALETTE);
let paletteButtons = [];
let row = document.createElement('div');
for (let i = 0; i < chars.length; i++) {
  let char = chars[i];
  let button = document.createElement('button');
  button.className = 'palette';
  button.textContent = chars[i];
  button.addEventListener('click', paletteSelect);
  paletteButtons.push(button);
  row.appendChild(button);

  if ((i + 1) % 4 == 0) {
    gui.appendChild(row);
    row = document.createElement('div');
  }
}
function paletteSelect(event) {
  let button = event.target;
  paletteButtons.forEach(b => b.className = 'palette');
  button.className = 'palette selected';
  brush.char = button.textContent;
  brush.color = PALETTE[brush.char].color;
  info.textContent = PALETTE[brush.char].help;
}

/*..............................new | load | copy.............................*/
let functionalRow = document.createElement('div')

/*```````````````````````````````````new``````````````````````````````````````*/
function removeCurrentDialog() {
  let dialog = document.querySelector('.dialog');
  if (dialog) dialog.remove();
}

let newButton = document.createElement('button');
newButton.textContent = 'new';
newButton.style.width = '60px';
newButton.addEventListener('click', showNewDialog);
functionalRow.appendChild(newButton);

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

  let guiRows = document.querySelectorAll('#gui > div');
  guiRows[0].appendChild(dialog);
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

/*`````````````````````````````````load``````````````````````````````````````*/
let loadButton = document.createElement('button');
loadButton.textContent = 'load';
loadButton.style.width = '60px';
loadButton.addEventListener('click', showLoadDialog);
functionalRow.appendChild(loadButton);

function showLoadDialog() {
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
  ok.addEventListener('click', confirmLoad);
  dialog.appendChild(ok);

  let no = document.createElement('button');
  no.textContent = '✗';
  no.addEventListener('click', removeCurrentDialog);
  dialog.appendChild(no);

  let guiRows = document.querySelectorAll('#gui > div');
  guiRows[0].appendChild(dialog);
}

function confirmLoad() {
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
functionalRow.appendChild(copyButton);
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

gui.appendChild(functionalRow);

/*``````````````````````````information / tip area````````````````````````````*/
let infoRow = document.createElement('div');
let info = document.createElement('textarea');
info.className = 'info';
info.rows = 3;
info.readOnly = true;
infoRow.appendChild(info);
gui.appendChild(infoRow);

/*//////////////////////////////////////////////////////////////////////////////
-                                INITIAL SETUP                                 -
//////////////////////////////////////////////////////////////////////////////*/
showLoadDialog();
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
document.querySelector('.dialog button').dispatchEvent(new MouseEvent('click'));
paletteButtons[1].dispatchEvent(new MouseEvent('click'));
info.textContent = 'I am a small level editor for the EJS platformer project!';
