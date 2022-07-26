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

let todoCurrentlyBeingEdited = null;

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
        const textContent = document.createTextNode(child);
        element.append(textContent);
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

  const todoText = createNewElement({
    type: 'div',
    id: `todo-${id}-text`,
    cls: 'todo__text',
    children: [content],
  });

  const todoContent = createNewElement({
    type: 'div',
    cls: 'todo__content',
    children: [todoText],
  });

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
    children: [markCompleteButton, editButton, deleteButton],
  });

  const todo = createNewElement({
    type: 'div',
    id: `todo-${id}`,
    cls: 'todo',
    attr: [{ name: 'status', value: isCompleted ? 'complete' : 'incomplete' }],
    children: [todoStatus, todoContent, todoActions],
  });

  todosContainer.appendChild(todo);
};

const updateLocalTodo = function (todo, action) {
  console.log(todo, action);
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
    addTodoDialog.removeAttribute('class');
  }
};

const handleTodoUpdate = function (e) {
  if (e.target.getAttribute('contenteditable') != '') {
    if (
      e.target.closest('button')?.getAttribute('role') === 'edit-button' ||
      e.target.getAttribute('role') === 'edit-button'
    ) {
      selectedForEditing = e.target.closest('.todo');
      if (todoCurrentlyBeingEdited === selectedForEditing) {
        submitEditingTodo(selectedForEditing.id.split('-')[1]);
      } else {
        // const initialText = text.innerText;
        if (todoCurrentlyBeingEdited)
          cancelEditingTodo(todoCurrentlyBeingEdited.id.split('-')[1]);
        todoCurrentlyBeingEdited = selectedForEditing;
        startEditingTodo(selectedForEditing.id.split('-')[1]);
      }
    } else if (todoCurrentlyBeingEdited)
      cancelEditingTodo(todoCurrentlyBeingEdited.id.split('-')[1]);
  } else console.log('click pe edit field');
};

const startEditingTodo = function (id) {
  const editButton = document.querySelector(`#todo-${id}-edit-button`);
  const text = document.querySelector(`#todo-${id}-text`);
  editButton.setAttribute('editing', 'true');
  editButton.innerHTML = '<i class="fa-solid fa-check"></i>';
  text.setAttribute('contenteditable', '');
  text.focus();
  console.log('editing ' + id);
};

const submitEditingTodo = function (id) {
  cancelEditingTodo(id);
  console.log('SE VA FACE UPDATE');
};

const cancelEditingTodo = function (id) {
  const editButton = document.querySelector(`#todo-${id}-edit-button`);
  const text = document.querySelector(`#todo-${id}-text`);
  editButton.setAttribute('editing', 'false');
  editButton.innerHTML = '<i class="fa-solid fa-pen"></i>';
  text.removeAttribute('contenteditable');
  text.blur();
  todoCurrentlyBeingEdited = null;
  console.log('cancelled editing for ' + id);
};

async function getTodos() {
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

async function addTodo() {
  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        todo: addTodoInput.value,
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
  try {
    const response = await fetch(`${apiURL}${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        todo: 'text de inlocuit',
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

getTodos();

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
window.addEventListener('click', handleTodoUpdate);
