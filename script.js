const apiURL = 'https://whatistheretodo.herokuapp.com/todos/';
const todosProgress = document.querySelector('#progress-circle');
const progressPercentage = document.querySelector('#progress-percentage');
const todosContainer = document.querySelector('#todos-container');
const addTodoButton = document.querySelector('#todo-add-button');
const addNewTodoField = document.querySelector('#add-new-todo-field');
const addNewTodoButton = document.querySelector('#add-new-todo-submit-button');
const cancelNewTodoButton = document.querySelector(
  '#add-new-todo-cancel-button'
);
const addNewTodoInput = document.querySelector('#add-new-todo-textarea');

const updateProgress = function () {
  const todos = [...todosContainer.querySelectorAll('.todo')];
  const percentage =
    Math.round(
      (todos.filter(todo => todo.getAttribute('status') === 'complete').length *
        100) /
        todos.length
    ) || 0;
  todosProgress.setAttribute(
    'style',
    `--value: ${Math.round(226 - 2.26 * percentage)};`
  );
  let currentPercentage = parseInt(progressPercentage.innerText.slice(0, -1));
  const progress = setInterval(() => {
    if (currentPercentage === percentage) {
      clearInterval(progress);
    } else {
      currentPercentage < percentage
        ? currentPercentage++
        : currentPercentage--;
      progressPercentage.innerText = `${currentPercentage}%`;
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
    if (typeof children === 'string') {
      const textContent = document.createTextNode(children);
      element.append(textContent);
    } else {
      children.forEach(child => {
        element.appendChild(child);
      });
    }
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
    type: 'p',
    id: `todo-${id}-text`,
    cls: 'todo__text',
    children: content,
  });

  const todoContent = createNewElement({
    type: 'div',
    cls: 'todo__content',
    children: [todoText],
  });

  const completeButton = createNewElement({
    type: 'button',
    id: `todo-${id}-complete-button`,
    cls: 'complete-button',
    attr: isCompleted ? [{ name: 'disabled', value: '' }] : null,
    children: isCompleted ? 'Completed' : 'Complete',
  });

  completeButton.addEventListener('click', () => {
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
    attr: isCompleted ? [{ name: 'disabled', value: '' }] : null,
    children: [editIcon],
  });

  editButton.addEventListener('click', () => {
    editTodo(id);
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

  const todoSettings = createNewElement({
    type: 'div',
    cls: 'todo__settings',
    children: [completeButton, editButton, deleteButton],
  });

  const todo = createNewElement({
    type: 'div',
    id: `todo-${id}`,
    cls: 'todo',
    attr: [{ name: 'status', value: isCompleted ? 'complete' : 'incomplete' }],
    children: [todoStatus, todoContent, todoSettings],
  });

  todosContainer.appendChild(todo);
};

const updateLocalTodo = function (todo, action) {
  const todoElement = document.querySelector(`#todo-${todo._id}`);
  console.log(todo, action);
  const todoText = todoElement.querySelector(`#todo-${todo._id}-text`);
  const completeButton = todoElement.querySelector(
    `#todo-${todo._id}-complete-button`
  );
  const editButton = todoElement.querySelector(`#todo-${todo._id}-edit-button`);
  if (action === 'deleted') {
    todosContainer.removeChild(todoElement);
  } else if (action === 'updated') {
    todoText.innerText = todo.todo;
    todoElement.setAttribute(
      'status',
      todo.isCompleted ? 'complete' : 'incomplete'
    );
    if (todo.isCompleted) {
      completeButton.setAttribute('disabled', '');
      completeButton.textContent = 'Completed';
      editButton.setAttribute('disabled', '');
    }
  }
  updateProgress();
};

const toggleAddTodoField = function (e) {
  if (e.target.id === 'add-new-todo-cancel-button') {
    addNewTodoInput.value = '';
    addNewTodoButton.setAttribute('disabled', '');
    addNewTodoField.classList.add('hidden');
  } else {
    addNewTodoField.removeAttribute('class');
  }
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
        todo: addNewTodoInput.value,
        isCompleted: false,
      }),
    });
    const todo = await response.json();
    addTodoElement(todo.todo, todo._id, todo.isCompleted);
    addNewTodoInput.value = '';
    addNewTodoButton.setAttribute('disabled', '');
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

addTodoButton.addEventListener('click', toggleAddTodoField);
addNewTodoInput.addEventListener('input', e => {
  if (e.target.value === '') {
    addNewTodoButton.setAttribute('disabled', '');
  } else {
    addNewTodoButton.removeAttribute('disabled');
  }
});
addNewTodoButton.addEventListener('click', addTodo);
cancelNewTodoButton.addEventListener('click', toggleAddTodoField);
