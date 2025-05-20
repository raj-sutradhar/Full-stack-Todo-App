document.addEventListener('DOMContentLoaded', function() {
    // Initialize date pickers
    initDatePickers();
    
    // Initialize task chart
    initTaskChart();
    
    // Initialize drag and drop
    initSortable();
    
    // Initialize theme toggle
    initThemeToggle();
    
    // Initialize filter and sort functionality
    initFilterAndSort();
    
    // Add event listeners to task checkboxes
    const taskCheckboxes = document.querySelectorAll('.task-checkbox');
    Array.from(taskCheckboxes).forEach(checkbox => {
        checkbox.addEventListener('click', toggleTaskStatus);
    });
    
    // Add event listeners to delete buttons
    const deleteButtons = document.querySelectorAll('.del');
    Array.from(deleteButtons).forEach(button => {
        button.addEventListener('click', deleteTodo);
    });
    
    // Add event listeners to edit buttons
    const editButtons = document.querySelectorAll('.edit-btn');
    Array.from(editButtons).forEach(button => {
        button.addEventListener('click', openEditModal);
    });
    
    // Modal close button
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeEditModal);
    }
    
    // Cancel edit button
    const cancelEditBtn = document.getElementById('cancel-edit');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditModal);
    }
    
    // Edit form submission
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', updateTodo);
    }
});

// Initialize date pickers
function initDatePickers() {
    // For new task form
    const dueDatePicker = document.getElementById('dueDate');
    if (dueDatePicker) {
        flatpickr(dueDatePicker, {
            enableTime: false,
            dateFormat: "Y-m-d",
            minDate: "today",
            altInput: true,
            altFormat: "F j, Y",
            theme: "dark"
        });
    }
    
    // For edit modal
    const editDueDatePicker = document.getElementById('edit-dueDate');
    if (editDueDatePicker) {
        flatpickr(editDueDatePicker, {
            enableTime: false,
            dateFormat: "Y-m-d",
            minDate: "today",
            altInput: true,
            altFormat: "F j, Y",
            theme: "dark"
        });
    }
}

// Initialize task chart
function initTaskChart() {
    const chartCanvas = document.getElementById('taskChart');
    if (!chartCanvas) return;
    
    // Get data from the page
    const pendingCount = parseInt(document.querySelector('.text-primary-500').textContent);
    const completedCount = parseInt(document.querySelector('.text-green-500').textContent);
    
    // Check if we're in dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // Set a fixed height for the chart container
    chartCanvas.parentElement.style.height = '220px';
    
    // Create chart
    const ctx = chartCanvas.getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [completedCount, pendingCount],
                backgroundColor: [
                    'rgb(34, 197, 94)', // green-500
                    'rgb(14, 165, 233)' // primary-500
                ],
                borderColor: isDarkMode ? '#1e293b' : '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDarkMode ? '#e2e8f0' : '#334155',
                        font: {
                            family: 'Inter',
                            size: 11
                        },
                        padding: 10,
                        boxWidth: 12,
                        boxHeight: 12
                    }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? '#334155' : '#ffffff',
                    titleColor: isDarkMode ? '#e2e8f0' : '#334155',
                    bodyColor: isDarkMode ? '#e2e8f0' : '#334155',
                    borderColor: isDarkMode ? '#475569' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            const total = completedCount + pendingCount;
                            const percentage = Math.round((context.raw / total) * 100);
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%',
            layout: {
                padding: {
                    top: 5,
                    bottom: 5
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 800
            }
        }
    });
}

// Initialize drag and drop functionality
function initSortable() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;
    
    new Sortable(taskList, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: async function(evt) {
            const items = Array.from(taskList.querySelectorAll('li.todoItem'));
            const positions = items.map((item, index) => ({
                id: item.dataset.id,
                position: index
            }));
            
            try {
                const response = await fetch('/todos/updatePosition', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ positions })
                });
                
                const result = await response.json();
                if (!result.success) {
                    console.error('Failed to update positions:', result.error);
                }
            } catch (err) {
                console.error('Error updating positions:', err);
            }
        }
    });
}

// Initialize theme toggle
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
    } else if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    }
    
    // Toggle theme on click
    themeToggle.addEventListener('click', function() {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        
        // Reinitialize chart with new theme
        initTaskChart();
    });
}

// Initialize filter and sort functionality
function initFilterAndSort() {
    const filterSelect = document.getElementById('filter-select');
    const sortSelect = document.getElementById('sort-select');
    const orderToggle = document.getElementById('order-toggle');
    const orderInput = document.getElementById('order-input');
    const filterForm = document.getElementById('filter-form');
    
    if (!filterSelect || !sortSelect || !orderToggle || !orderInput || !filterForm) return;
    
    // Submit form when filter or sort changes
    filterSelect.addEventListener('change', () => filterForm.submit());
    sortSelect.addEventListener('change', () => filterForm.submit());
    
    // Toggle sort order
    orderToggle.addEventListener('click', function() {
        const currentOrder = orderInput.value;
        const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        
        // Update icon
        const icon = orderToggle.querySelector('i');
        icon.className = `fas fa-sort-${newOrder === 'asc' ? 'up' : 'down'}`;
        
        // Update hidden input and submit form
        orderInput.value = newOrder;
        filterForm.submit();
    });
}

// Toggle task status (complete/incomplete)
async function toggleTaskStatus() {
    const todoItem = this.closest('.todoItem');
    const todoId = todoItem.dataset.id;
    const isCompleted = this.querySelector('.fa-check-circle') !== null;
    
    try {
        const endpoint = isCompleted ? 'todos/markIncomplete' : 'todos/markComplete';
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'todoIdFromJSFile': todoId
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Update UI without reloading
            const icon = this.querySelector('i');
            const todoText = todoItem.querySelector('.todo-text');
            
            if (isCompleted) {
                // Mark as incomplete
                icon.className = 'far fa-circle text-slate-400 text-xl';
                todoText.classList.remove('text-slate-500', 'dark:text-slate-500', 'line-through');
                todoText.classList.add('text-slate-800', 'dark:text-slate-300');
            } else {
                // Mark as complete
                icon.className = 'fas fa-check-circle text-green-500 text-xl';
                todoText.classList.remove('text-slate-800', 'dark:text-slate-300');
                todoText.classList.add('text-slate-500', 'dark:text-slate-500', 'line-through');
            }
            
            // Update task counts
            updateTaskCounts(isCompleted ? 1 : -1);
        } else {
            console.error('Failed to update task status:', data.error);
            location.reload();
        }
    } catch (err) {
        console.error('Error updating task status:', err);
        location.reload();
    }
}

// Delete todo
async function deleteTodo() {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    const todoItem = this.closest('.todoItem');
    const todoId = todoItem.dataset.id;
    const isCompleted = todoItem.querySelector('.fa-check-circle') !== null;
    
    try {
        const response = await fetch('todos/deleteTodo', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'todoIdFromJSFile': todoId
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Remove item from DOM
            todoItem.remove();
            
            // Update task counts
            updateTaskCounts(isCompleted ? 0 : -1, -1);
            
            // Update total count in the header
            const totalCountEl = document.querySelector('.text-xs.px-2.py-1.rounded-full.bg-primary-600\\/20');
            if (totalCountEl) {
                const currentTotal = parseInt(totalCountEl.textContent);
                totalCountEl.textContent = `${currentTotal - 1} total`;
            }
        } else {
            console.error('Failed to delete task:', data.error);
            location.reload();
        }
    } catch (err) {
        console.error('Error deleting task:', err);
        location.reload();
    }
}

// Update task counts in the UI
function updateTaskCounts(pendingChange, totalChange = 0) {
    // Update pending count
    const pendingCountEl = document.querySelector('.text-primary-500');
    if (pendingCountEl) {
        const currentPending = parseInt(pendingCountEl.textContent);
        pendingCountEl.textContent = currentPending + pendingChange;
    }
    
    // Update completed count
    const completedCountEl = document.querySelector('.text-green-500');
    if (completedCountEl) {
        const currentCompleted = parseInt(completedCountEl.textContent);
        completedCountEl.textContent = currentCompleted - pendingChange;
    }
    
    // Update total count
    if (totalChange !== 0) {
        const totalCountEl = document.querySelector('.text-indigo-500');
        if (totalCountEl) {
            const currentTotal = parseInt(totalCountEl.textContent);
            totalCountEl.textContent = currentTotal + totalChange;
        }
    }
    
    // Reinitialize chart with new data
    initTaskChart();
}

// Open edit modal
async function openEditModal() {
    const todoItem = this.closest('.todoItem');
    const todoId = todoItem.dataset.id;
    
    try {
        const response = await fetch(`/todos/todo/${todoId}`);
        const data = await response.json();
        
        if (data.success) {
            const todo = data.todo;
            
            // Populate form fields
            document.getElementById('edit-id').value = todo._id;
            document.getElementById('edit-todo').value = todo.todo;
            document.getElementById('edit-priority').value = todo.priority;
            document.getElementById('edit-category').value = todo.category;
            document.getElementById('edit-notes').value = todo.notes || '';
            
            // Handle due date
            const editDueDatePicker = document.getElementById('edit-dueDate')._flatpickr;
            if (todo.dueDate) {
                editDueDatePicker.setDate(new Date(todo.dueDate));
            } else {
                editDueDatePicker.clear();
            }
            
            // Show modal
            document.getElementById('edit-modal').classList.remove('hidden');
        } else {
            console.error('Failed to fetch task details:', data.error);
        }
    } catch (err) {
        console.error('Error fetching task details:', err);
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

// Update todo
async function updateTodo(e) {
    e.preventDefault();
    
    const todoId = document.getElementById('edit-id').value;
    const todoText = document.getElementById('edit-todo').value;
    const priority = document.getElementById('edit-priority').value;
    const category = document.getElementById('edit-category').value;
    const notes = document.getElementById('edit-notes').value;
    
    // Get due date from flatpickr
    const dueDatePicker = document.getElementById('edit-dueDate')._flatpickr;
    const dueDate = dueDatePicker.selectedDates.length > 0 ? dueDatePicker.selectedDates[0] : null;
    
    try {
        const response = await fetch('/todos/updateTodo', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: todoId,
                todo: todoText,
                dueDate,
                priority,
                category,
                notes
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Close modal and reload page to show updated task
            closeEditModal();
            location.reload();
        } else {
            console.error('Failed to update task:', data.error);
            alert('Failed to update task. Please try again.');
        }
    } catch (err) {
        console.error('Error updating task:', err);
        alert('An error occurred. Please try again.');
    }
}