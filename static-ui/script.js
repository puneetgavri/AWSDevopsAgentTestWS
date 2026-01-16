// API Configuration
const API_URL = 'YOUR_API_GATEWAY_URL_HERE';

// DOM Elements
const todoForm = document.getElementById('todoForm');
const editForm = document.getElementById('editForm');
const todosList = document.getElementById('todosList');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');
const editModal = document.getElementById('editModal');
const refreshBtn = document.getElementById('refreshBtn');
const todoCountEl = document.getElementById('todoCount');
const completedCountEl = document.getElementById('completedCount');

// State
let todos = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    todoForm.addEventListener('submit', handleAddTodo);
    editForm.addEventListener('submit', handleEditTodo);
    refreshBtn.addEventListener('click', loadTodos);
}

// Load all todos
async function loadTodos() {
    showLoading();
    hideError();

    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        todos = data.todos || [];
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error loading todos:', error);
        showError('Failed to load todos. Please check your API URL and try again.');
    } finally {
        hideLoading();
    }
}

// Handle Add Todo
async function handleAddTodo(e) {
    e.preventDefault();
    
    const formData = new FormData(todoForm);
    const title = formData.get('title').trim();
    const description = formData.get('description').trim();

    if (!title) {
        showError('Title is required');
        return;
    }

    const submitBtn = todoForm.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    submitBtn.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Todo created:', data);
        
        todoForm.reset();
        await loadTodos();
        showSuccess('Todo added successfully!');
    } catch (error) {
        console.error('Error adding todo:', error);
        showError('Failed to add todo. Please try again.');
    } finally {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Handle Edit Todo
async function handleEditTodo(e) {
    e.preventDefault();
    
    const todoId = document.getElementById('editTodoId').value;
    const title = document.getElementById('editTodoTitle').value.trim();
    const description = document.getElementById('editTodoDescription').value.trim();
    const completed = document.getElementById('editTodoCompleted').checked;

    if (!title) {
        showError('Title is required');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${todoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description, completed })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Todo updated:', data);
        
        closeEditModal();
        await loadTodos();
        showSuccess('Todo updated successfully!');
    } catch (error) {
        console.error('Error updating todo:', error);
        showError('Failed to update todo. Please try again.');
    }
}

// Delete Todo
async function deleteTodo(todoId) {
    if (!confirm('Are you sure you want to delete this todo?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${todoId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Todo deleted:', data);
        
        await loadTodos();
        showSuccess('Todo deleted successfully!');
    } catch (error) {
        console.error('Error deleting todo:', error);
        showError('Failed to delete todo. Please try again.');
    }
}

// Open Edit Modal
function openEditModal(todo) {
    document.getElementById('editTodoId').value = todo.id;
    document.getElementById('editTodoTitle').value = todo.title;
    document.getElementById('editTodoDescription').value = todo.description || '';
    document.getElementById('editTodoCompleted').checked = todo.completed;
    editModal.style.display = 'flex';
}

// Close Edit Modal
function closeEditModal() {
    editModal.style.display = 'none';
    editForm.reset();
}

// Close modal when clicking outside
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});

// Render Todos
function renderTodos() {
    if (todos.length === 0) {
        todosList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    
    todosList.innerHTML = todos.map(todo => {
        const createdDate = new Date(todo.created_at).toLocaleDateString();
        const statusClass = todo.completed ? 'status-completed' : 'status-pending';
        const statusText = todo.completed ? 'Completed' : 'Pending';
        const completedClass = todo.completed ? 'completed' : '';
        
        return `
            <div class="todo-item ${completedClass}">
                <div class="todo-header">
                    <div class="todo-title">${escapeHtml(todo.title)}</div>
                    <span class="todo-status ${statusClass}">${statusText}</span>
                </div>
                ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
                <div class="todo-meta">
                    Created: ${createdDate}
                </div>
                <div class="todo-actions">
                    <button class="btn btn-edit" onclick='openEditModal(${JSON.stringify(todo)})'>
                        ✏️ Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteTodo('${todo.id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Update Statistics
function updateStats() {
    const totalCount = todos.length;
    const completedCount = todos.filter(todo => todo.completed).length;
    
    todoCountEl.textContent = `${totalCount} todo${totalCount !== 1 ? 's' : ''}`;
    completedCountEl.textContent = `${completedCount} completed`;
}

// UI Helper Functions
function showLoading() {
    loadingIndicator.style.display = 'block';
    todosList.style.display = 'none';
    emptyState.style.display = 'none';
}

function hideLoading() {
    loadingIndicator.style.display = 'none';
    todosList.style.display = 'grid';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function hideError() {
    errorMessage.style.display = 'none';
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'error-message';
    successDiv.style.background = '#d4edda';
    successDiv.style.color = '#155724';
    successDiv.style.borderLeftColor = '#155724';
    successDiv.textContent = message;
    
    errorMessage.parentNode.insertBefore(successDiv, errorMessage);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
