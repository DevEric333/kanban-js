const LS_KEY = "kanban_board_v1";
const dropzones = {
  todo: document.getElementById("col-todo"),
  doing: document.getElementById("col-doing"),
  done: document.getElementById("col-done"),
};
const counts = {
  todo: document.getElementById("count-todo"),
  doing: document.getElementById("count-doing"),
  done: document.getElementById("count-done"),
};

let board = load() || { todo: [], doing: [], done: [] };
let dragging = null;

renderAll();

// Novo item
document.getElementById("new-task").addEventListener("submit", (e) => {
  e.preventDefault();
  const titleEl = document.getElementById("task-title");
  const colEl = document.getElementById("task-column");
  const title = titleEl.value.trim();
  if (!title) return;

  const card = { id: Date.now().toString(), title };
  board[colEl.value].push(card);
  save(); renderColumn(colEl.value); updateCounts();
  titleEl.value = "";
});

// Exportar JSON
document.getElementById("btn-export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(board, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "kanban.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

// Limpar board
document.getElementById("btn-clear").addEventListener("click", () => {
  if (!confirm("Tem certeza que deseja limpar todas as tarefas?")) return;
  board = { todo: [], doing: [], done: [] };
  save(); renderAll();
});

// ----- Renderização -----
function renderAll(){
  Object.keys(dropzones).forEach(renderColumn);
  updateCounts();
}

function renderColumn(col){
  const zone = dropzones[col];
  zone.innerHTML = "";
  board[col].forEach(card => zone.appendChild(createCardEl(card, col)));
  attachDnD(zone, col);
}

function createCardEl(card, col){
  const el = document.createElement("div");
  el.className = "card";
  el.draggable = true;
  el.dataset.id = card.id;
  el.dataset.col = col;

  const title = document.createElement("p");
  title.className = "title";
  title.textContent = card.title;

  const controls = document.createElement("div");
  controls.className = "controls";

  const btnEdit = document.createElement("button");
  btnEdit.className = "iconbtn";
  btnEdit.title = "Editar";
  btnEdit.textContent = "✏️";
  btnEdit.addEventListener("click", () => editCard(card.id, col, title));

  const btnDel = document.createElement("button");
  btnDel.className = "iconbtn";
  btnDel.title = "Excluir";
  btnDel.textContent = "🗑️";
  btnDel.addEventListener("click", () => deleteCard(card.id, col));

  controls.append(btnEdit, btnDel);
  el.append(title, controls);

  el.addEventListener("dragstart", () => { dragging = { id: card.id, from: col }; el.classList.add("dragging"); });
  el.addEventListener("dragend", () => { dragging = null; el.classList.remove("dragging"); });

  return el;
}

function attachDnD(zone, col){
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("drop-hover"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("drop-hover"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault(); zone.classList.remove("drop-hover");
    if (!dragging) return;
    if (dragging.from === col) return;

    const card = removeFromBoard(dragging.id, dragging.from);
    board[col].push(card);
    save(); renderColumn(dragging.from); renderColumn(col); updateCounts();
  });
}

// ----- Operações -----
function editCard(id, col, titleEl){
  const current = board[col].find(c => c.id === id);
  const novo = prompt("Editar título da tarefa:", current.title);
  if (novo === null) return;
  current.title = novo.trim() || current.title;
  save(); titleEl.textContent = current.title;
}

function deleteCard(id, col){
  if (!confirm("Remover esta tarefa?")) return;
  removeFromBoard(id, col);
  save(); renderColumn(col); updateCounts();
}

function removeFromBoard(id, col){
  const idx = board[col].findIndex(c => c.id === id);
  if (idx === -1) return null;
  const [card] = board[col].splice(idx, 1);
  return card;
}

function updateCounts(){
  counts.todo.textContent = board.todo.length;
  counts.doing.textContent = board.doing.length;
  counts.done.textContent = board.done.length;
}

// ----- Persistência -----
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(board)); }
function load(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)); } catch { return null; } }
