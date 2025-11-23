// State Management
let tasks = [];

// DOM Elements
const taskListPending = document.getElementById('task-list-pending');
const taskListProgress = document.getElementById('task-list-progress');
const taskListCompleted = document.getElementById('task-list-completed');
const taskModal = document.getElementById('task-modal');
const modalContent = document.getElementById('modal-content');
const taskForm = document.getElementById('task-form');
const searchInput = document.getElementById('search-input');
const emptyStatePending = document.getElementById('empty-state-pending');
const emptyStateProgress = document.getElementById('empty-state-progress');
const emptyStateCompleted = document.getElementById('empty-state-completed');

// Details Modal Elements
const detailsModal = document.getElementById('details-modal');
const detailsModalContent = document.getElementById('details-modal-content');
const notesTimeline = document.getElementById('notes-timeline');
const noteForm = document.getElementById('note-form');
const notesEmptyState = document.getElementById('notes-empty-state');

// Confirmation Modal Elements
const confirmModal = document.getElementById('confirm-modal');
const confirmModalContent = document.getElementById('confirm-modal-content');
const confirmMessage = document.getElementById('confirm-message');
let pendingDeleteAction = null;

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statInProgress = document.getElementById('stat-in-progress');
const statCompleted = document.getElementById('stat-completed');
const statPending = document.getElementById('stat-pending');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderTasks();
    updateStats();

    // Event Listeners
    searchInput.addEventListener('input', renderTasks);

    // Start Clock
    updateClock();
    setInterval(updateClock, 1000);
});

// Clock Function
// Clock Function
function updateClock() {
    const now = new Date();

    // Time: HH:MM:SS
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const timeString = now.toLocaleTimeString('en-US', timeOptions);

    // Date: DayOfWeek, Month Day, Year
    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const dateString = now.toLocaleDateString('en-US', dateOptions);

    const timeCard = document.getElementById('current-time-card');
    const dateCard = document.getElementById('current-date-card');

    if (timeCard) timeCard.innerText = timeString;
    if (dateCard) dateCard.innerText = dateString;

    // Legacy clock support if it exists
    const clockEl = document.getElementById('clock-display');
    if (clockEl) clockEl.innerText = now.toLocaleString('en-US', { ...timeOptions, ...dateOptions });
}

// CRUD Operations
function loadTasks() {
    const storedTasks = localStorage.getItem('projectTrackerTasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
        // Migration: Ensure all tasks have a notes array
        tasks.forEach(task => {
            if (!task.notes) task.notes = [];
        });
    }
}

function saveTasks() {
    localStorage.setItem('projectTrackerTasks', JSON.stringify(tasks));
    updateStats();
    renderTasks();
}

function addTask(task) {
    tasks.push({
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        notes: [],
        ...task
    });
    saveTasks();
}

function updateTask(id, updatedTask) {
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updatedTask };
        saveTasks();
    }
}

function deleteTask(id) {
    showConfirmModal('Are you sure you want to delete this task? This action cannot be undone.', () => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        closeModal(); // Close edit modal if open
        closeDetailsModal(); // Close details modal if open
    });
}

function getTask(id) {
    return tasks.find(t => t.id === id);
}

// Note Operations
function addNote(taskId, note) {
    const task = getTask(taskId);
    if (task) {
        if (!task.notes) task.notes = [];
        task.notes.unshift({ // Add to beginning
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            ...note
        });
        saveTasks();
        renderNotesList(taskId);
    }
}

function deleteNote(taskId, noteId) {
    showConfirmModal('Are you sure you want to delete this note?', () => {
        const task = getTask(taskId);
        if (task && task.notes) {
            task.notes = task.notes.filter(n => n.id !== noteId);
            saveTasks();
            renderNotesList(taskId);
        }
    });
}

// UI Functions
function openModal(taskId = null) {
    taskModal.classList.remove('hidden');
    void taskModal.offsetWidth; // Trigger reflow

    modalContent.classList.remove('opacity-0', 'scale-95');
    modalContent.classList.add('opacity-100', 'scale-100');

    if (taskId) {
        const task = getTask(taskId);
        document.getElementById('modal-title').innerText = 'Edit Task';
        document.getElementById('task-id').value = task.id;
        document.getElementById('title').value = task.title;
        document.getElementById('deadline').value = task.deadline;
        document.getElementById('status').value = task.status;
    } else {
        document.getElementById('modal-title').innerText = 'New Task';
        taskForm.reset();
        document.getElementById('task-id').value = '';
        document.getElementById('deadline').valueAsDate = new Date();
    }
}

function closeModal() {
    modalContent.classList.remove('opacity-100', 'scale-100');
    modalContent.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        taskModal.classList.add('hidden');
    }, 200);
}

function openDetailsModal(taskId) {
    const task = getTask(taskId);
    if (!task) return;

    document.getElementById('details-title').innerText = task.title;
    const statusEl = document.getElementById('details-status');
    statusEl.innerText = task.status;
    // Reset status classes
    statusEl.className = 'text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block';

    // Apply status colors
    if (task.status === 'Completed') statusEl.classList.add('bg-emerald-100', 'text-emerald-800');
    else if (task.status === 'In Progress') statusEl.classList.add('bg-blue-100', 'text-blue-800');
    else statusEl.classList.add('bg-gray-100', 'text-gray-800');

    document.getElementById('details-task-id').value = task.id;
    document.getElementById('note-date').valueAsDate = new Date();
    document.getElementById('note-content').value = '';

    renderNotesList(taskId);

    detailsModal.classList.remove('hidden');
    void detailsModal.offsetWidth;
    detailsModalContent.classList.remove('opacity-0', 'scale-95');
    detailsModalContent.classList.add('opacity-100', 'scale-100');
}

function closeDetailsModal() {
    detailsModalContent.classList.remove('opacity-100', 'scale-100');
    detailsModalContent.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        detailsModal.classList.add('hidden');
    }, 200);
}

// Confirmation Modal Functions
function showConfirmModal(message, onConfirm) {
    confirmMessage.innerText = message;
    pendingDeleteAction = onConfirm;

    confirmModal.classList.remove('hidden');
    void confirmModal.offsetWidth;
    confirmModalContent.classList.remove('opacity-0', 'scale-95');
    confirmModalContent.classList.add('opacity-100', 'scale-100');
}

function closeConfirmModal() {
    confirmModalContent.classList.remove('opacity-100', 'scale-100');
    confirmModalContent.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        confirmModal.classList.add('hidden');
        pendingDeleteAction = null;
    }, 200);
}

function confirmDelete() {
    if (pendingDeleteAction) {
        pendingDeleteAction();
    }
    closeConfirmModal();
}

function handleFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('task-id').value;
    const taskData = {
        title: document.getElementById('title').value,
        deadline: document.getElementById('deadline').value,
        status: document.getElementById('status').value
    };

    if (id) updateTask(id, taskData);
    else addTask(taskData);

    closeModal();
}

function handleAddNote(event) {
    event.preventDefault();
    const taskId = document.getElementById('details-task-id').value;
    const noteData = {
        date: document.getElementById('note-date').value,
        content: document.getElementById('note-content').value
    };
    addNote(taskId, noteData);
    document.getElementById('note-content').value = ''; // Clear textarea
}

function renderNotesList(taskId) {
    const task = getTask(taskId);
    notesTimeline.innerHTML = '';

    if (!task.notes || task.notes.length === 0) {
        notesEmptyState.classList.remove('hidden');
        return;
    }
    notesEmptyState.classList.add('hidden');

    // Sort notes by date descending (newest first)
    const sortedNotes = [...task.notes].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedNotes.forEach(note => {
        const noteEl = document.createElement('div');
        noteEl.className = 'relative pl-8 sm:pl-32 py-2 group';

        noteEl.innerHTML = `
            <!-- Date Label (Desktop) -->
            <div class="hidden sm:flex flex-col items-end absolute left-0 top-2 w-24 pr-4">
                <span class="text-xs font-bold text-gray-500">${new Date(note.date).toLocaleDateString()}</span>
                <span class="text-[10px] text-gray-400">${new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            
            <!-- Timeline Dot -->
            <div class="absolute left-2 sm:left-auto sm:ml-5 top-4 w-3 h-3 rounded-full bg-primary border-2 border-white shadow-sm z-10"></div>

            <!-- Card -->
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative">
                <!-- Date Label (Mobile) -->
                <div class="sm:hidden mb-2">
                    <span class="text-xs font-bold text-gray-500">${new Date(note.date).toLocaleDateString()}</span>
                </div>
                
                <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">${note.content}</p>
                
                <button onclick="deleteNote('${taskId}', '${note.id}')" class="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        notesTimeline.appendChild(noteEl);
    });
}

function renderTasks() {
    const searchTerm = searchInput.value.toLowerCase();

    // Clear all columns
    taskListPending.innerHTML = '';
    taskListProgress.innerHTML = '';
    taskListCompleted.innerHTML = '';

    // Hide empty states by default
    emptyStatePending.classList.add('hidden');
    emptyStateProgress.classList.add('hidden');
    emptyStateCompleted.classList.add('hidden');

    // Group tasks by status
    const groupedTasks = {
        'Not Started': [],
        'In Progress': [],
        'Completed': []
    };

    // Filter and group tasks
    tasks.forEach(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm);
        if (matchesSearch) {
            groupedTasks[task.status].push(task);
        }
    });

    // Render each status column
    renderTaskColumn(groupedTasks['Not Started'], taskListPending, emptyStatePending);
    renderTaskColumn(groupedTasks['In Progress'], taskListProgress, emptyStateProgress);
    renderTaskColumn(groupedTasks['Completed'], taskListCompleted, emptyStateCompleted);
}

function renderTaskColumn(tasks, container, emptyState, status) {
    // If no tasks, show empty state and return
    if (tasks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    // Hide empty state when there are tasks
    emptyState.classList.add('hidden');

    tasks.forEach(task => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors group';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${task.title}</div>
                <div class="text-xs text-gray-500 sm:hidden">${new Date(task.deadline).toLocaleDateString()}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(task.deadline).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap align-middle">
                <div class="text-sm text-gray-500 max-w-xs truncate" title="${task.notes && task.notes.length > 0 ? task.notes[0].content : 'No notes'}">
                    ${task.notes && task.notes.length > 0 ? task.notes[0].content : '<span class="text-gray-400">-</span>'}
                </div>
                <div class="text-xs text-gray-400 mt-0.5">
                    ${task.notes && task.notes.length > 0 ? new Date(task.notes[0].date).toLocaleDateString() : ''}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="openDetailsModal('${task.id}')" class="text-gray-500 hover:text-primary mr-3 transition-colors" title="View Details & Notes">
                    <i class="fas fa-info-circle text-lg"></i>
                </button>
                <button onclick="openModal('${task.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors" title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTask('${task.id}')" class="text-red-600 hover:text-red-900 transition-colors" title="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        container.appendChild(row);
    });
}

function updateStats() {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status === 'Not Started').length;

    animateValue(statTotal, parseInt(statTotal.innerText), total, 500);
    animateValue(statInProgress, parseInt(statInProgress.innerText), inProgress, 500);
    animateValue(statCompleted, parseInt(statCompleted.innerText), completed, 500);
    animateValue(statPending, parseInt(statPending.innerText), pending, 500);
}

function animateValue(obj, start, end, duration) {
    if (start === end) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Close modals when clicking outside
window.onclick = function (event) {
    if (event.target == taskModal) {
        closeModal();
    }
    if (event.target == detailsModal) {
        closeDetailsModal();
    }
    if (event.target == confirmModal) {
        closeConfirmModal();
    }
}
