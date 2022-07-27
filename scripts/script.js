const apiURL = 'https://whatistheretodo.herokuapp.com/todos/';
const progressIndicator = document.querySelector('#progress-indicator');
const progressIndicatorValue = document.querySelector(
  '#progress-indicator-value'
);
const addTodoToggle = document.querySelector('#add-todo-toggle');
const addTodoDialog = document.querySelector('#add-todo-dialog');
const addTodoInput = document.querySelector('#add-todo-input');
const addTodoButton = document.querySelector('#add-todo-button');
const cancelAddTodoButton = document.querySelector('#cancel-add-todo-button');
const todosContainer = document.querySelector('#todos-container');

let todoBeingEdited = null;

const updateProgress = function () {
  const todos = [...todosContainer.querySelectorAll('.todo')];
  const completedPercentage =
    Math.round(
      (todos.filter(todo => todo.getAttribute('status') === 'complete').length *
        100) /
        todos.length
    ) || 0;
  progressIndicator.setAttribute(
    'style',
    `--value: ${Math.round(226 - 2.26 * completedPercentage)};`
  );
  let currentPercentage = parseInt(
    progressIndicatorValue.innerText.slice(0, -1)
  );
  const progress = setInterval(() => {
    if (currentPercentage === completedPercentage) {
      clearInterval(progress);
    } else {
      currentPercentage < completedPercentage
        ? currentPercentage++
        : currentPercentage--;
      progressIndicatorValue.innerText = `${currentPercentage}%`;
    }
  }, 10);
};

const createNewElement = function ({
  type = '',
  id = '',
  cls = '',
  attr = null,
  children = null,
}) {
  const element = document.createElement(type);
  if (id) element.setAttribute('id', id);
  if (cls) element.className = cls;
  if (attr) {
    attr.forEach(attribute => {
      element.setAttribute(attribute.name, attribute.value);
    });
  }
  if (children) {
    children.forEach(child => {
      if (typeof child === 'string') {
        const textNode = document.createTextNode(child);
        element.append(textNode);
      } else {
        element.appendChild(child);
      }
    });
  }
  return element;
};

const addTodoElement = function (content, id, isCompleted) {
  const checkIcon = createNewElement({
    type: 'i',
    cls: 'fa-solid fa-circle-check',
  });

  const todoStatus = createNewElement({
    type: 'div',
    id: `todo-${id}-status`,
    cls: 'todo__status',
    children: [checkIcon],
  });

  const inputField = createNewElement({
    type: 'div',
    id: `todo-${id}-text`,
    cls: 'todo__text',
    children: [content],
  });

  const todoContent = createNewElement({
    type: 'div',
    cls: 'todo__content',
    children: [inputField],
  });

  const editIcon = createNewElement({
    type: 'i',
    cls: 'fa-solid fa-pen',
  });

  const editButton = createNewElement({
    type: 'button',
    id: `todo-${id}-edit-button`,
    cls: 'glyph small dark',
    attr: [
      ...(isCompleted ? [{ name: 'disabled', value: '' }] : []),
      { name: 'role', value: 'edit-button' },
    ],
    children: [editIcon],
  });

  editButton.addEventListener('click', handleEditTodo);

  const markCompleteButton = createNewElement({
    type: 'button',
    id: `todo-${id}-mark-complete-button`,
    cls: 'mark-complete-button',
    attr: [...(isCompleted ? [{ name: 'disabled', value: '' }] : [])],
    children: [isCompleted ? 'Completed' : 'Complete'],
  });

  markCompleteButton.addEventListener('click', () => {
    markComplete(id);
  });

  const deleteIcon = createNewElement({
    type: 'i',
    cls: 'fa-solid fa-trash-can',
  });

  const deleteButton = createNewElement({
    type: 'button',
    id: `todo-${id}-delete-button`,
    cls: 'glyph small dark',
    children: [deleteIcon],
  });

  deleteButton.addEventListener('click', () => {
    deleteTodo(id);
  });

  const todoActions = createNewElement({
    type: 'div',
    cls: 'todo__actions',
    children: [markCompleteButton, deleteButton],
  });

  const todo = createNewElement({
    type: 'div',
    id: `todo-${id}`,
    cls: 'todo',
    attr: [{ name: 'status', value: isCompleted ? 'complete' : 'incomplete' }],
    children: [todoStatus, todoContent, editButton, todoActions],
  });

  todosContainer.appendChild(todo);
};

const updateLocalTodo = function (todo, action) {
  const todoElement = document.querySelector(`#todo-${todo._id}`);
  const todoText = todoElement.querySelector(`#todo-${todo._id}-text`);
  const markCompleteButton = todoElement.querySelector(
    `#todo-${todo._id}-mark-complete-button`
  );
  const editButton = todoElement.querySelector(`#todo-${todo._id}-edit-button`);

  if (action === 'deleted') {
    todosContainer.removeChild(todoElement);
  } else if (action === 'updated') {
    todoText.innerText = todo.todo;
    if (todo.isCompleted) {
      todoElement.setAttribute('status', 'complete');
      markCompleteButton.setAttribute('disabled', '');
      markCompleteButton.textContent = 'Completed';
      editButton.setAttribute('disabled', '');
    }
  }
  updateProgress();
};

const toggleAddTodoDialog = function (e) {
  if (e.target === cancelAddTodoButton) {
    addTodoInput.value = '';
    addTodoButton.setAttribute('disabled', '');
    addTodoDialog.classList.add('hidden');
  } else {
    addTodoDialog.classList.remove('hidden');
  }
};

const handleEditTodo = function (e) {
  const editButton = e.target.closest('button');
  const todo = e.target.closest('.todo');

  if (editButton.getAttribute('editing') === 'true') {
    finishEditingTodo(todo);
    todoBeingEdited = null;
  } else {
    todoBeingEdited = todo;
    startEditingTodo(todo);
  }
};

const startEditingTodo = function (todo) {
  const editButton = todo.querySelector(`#${todo.id}-edit-button`);
  const inputField = todo.querySelector(`#${todo.id}-text`);
  editButton.setAttribute('editing', 'true');
  editButton.innerHTML = '<i class="fa-solid fa-check"></i>';
  inputField.setAttribute('contenteditable', '');
  inputField.focus();
};

const finishEditingTodo = async function (todo) {
  const editButton = todo.querySelector(`#${todo.id}-edit-button`);
  const inputField = todo.querySelector(`#${todo.id}-text`);
  await editTodo(todo.id.split('-')[1]);
  editButton.setAttribute('editing', 'false');
  editButton.innerHTML = '<i class="fa-solid fa-pen"></i>';
  inputField.removeAttribute('contenteditable');
};

const abortEditingTodo = async function (todo) {
  const editButton = todo.querySelector(`#${todo.id}-edit-button`);
  const inputField = todo.querySelector(`#${todo.id}-text`);
  const initial = await getRemoteTodo(todo.id.split('-')[1]);
  inputField.innerText = initial.todo;
  editButton.setAttribute('editing', 'false');
  editButton.innerHTML = '<i class="fa-solid fa-pen"></i>';
  inputField.removeAttribute('contenteditable');
  inputField.blur();
};

async function getRemoteTodos() {
  try {
    const response = await fetch(apiURL);
    const todoList = await response.json();
    todoList.forEach(todo =>
      addTodoElement(todo.todo, todo._id, todo.isCompleted)
    );
    updateProgress();
  } catch (error) {
    console.warn(`Error(${error.name}): ${error.message}`);
  }
}

async function getRemoteTodo(id) {
  try {
    const response = await fetch(`${apiURL}${id}`);
    const todo = await response.json();
    return todo;
  } catch (error) {
    console.warn(`Error(${error.name}): ${error.message}`);
  }
}

async function addTodo() {
  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        todo:
          addTodoInput.value.trim() || 'Nothing to do. Did we miss something?',
        isCompleted: false,
      }),
    });
    const todo = await response.json();
    addTodoElement(todo.todo, todo._id, todo.isCompleted);
    updateProgress();
    addTodoInput.value = '';
    addTodoButton.setAttribute('disabled', '');
  } catch (error) {
    console.warn(`Error(${error.name}): ${error.message}`);
  }
}

async function markComplete(id) {
  try {
    const response = await fetch(`${apiURL}${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isCompleted: true,
      }),
    });
    const todo = await response.json();
    updateLocalTodo(todo, 'updated');
  } catch (error) {
    console.warn(`Error(${error.name}): ${error.message}`);
  }
}

async function editTodo(id) {
  const text = document.querySelector(`#todo-${id}-text`).textContent.trim();
  try {
    const response = await fetch(`${apiURL}${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        todo: text,
      }),
    });
    const todo = await response.json();
    updateLocalTodo(todo, 'updated');
  } catch (error) {
    console.warn(`Error(${error.name}): ${error.message}`);
  }
}

async function deleteTodo(id) {
  try {
    const response = await fetch(`${apiURL}${id}`, {
      method: 'DELETE',
    });
    const todo = await response.json();
    updateLocalTodo(todo, 'deleted');
  } catch (error) {
    console.warn(`Error(${error.name}): ${error.message}`);
  }
}

getRemoteTodos();

addTodoToggle.addEventListener('click', toggleAddTodoDialog);
addTodoInput.addEventListener('input', e => {
  if (e.target.value === '') {
    addTodoButton.setAttribute('disabled', '');
  } else {
    addTodoButton.removeAttribute('disabled');
  }
});
addTodoButton.addEventListener('click', addTodo);
cancelAddTodoButton.addEventListener('click', toggleAddTodoDialog);

window.addEventListener(
  'click',
  e => {
    if (todoBeingEdited) {
      const editButton = todoBeingEdited.querySelector('[role="edit-button"]');
      const textInput = todoBeingEdited.querySelector('.todo__text');
      if (e.target !== textInput && e.target.closest('button') !== editButton) {
        abortEditingTodo(todoBeingEdited);
        todoBeingEdited = null;
      }
    }
  },
  true
);

window.addEventListener('keydown', e => {
  if (todoBeingEdited && e.key === 'Escape') {
    abortEditingTodo(todoBeingEdited);
    todoBeingEdited = null;
  }
});
