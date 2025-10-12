const statuses = ['to do', 'in progress', 'completed'];
const allTaskButtons = new Map();

const priorityWeights = {
    low: 1,
    medium: 2,
    high: 3
};

const statusWeights = {
    'to do': 1,
    'in progress': 2,
    'completed': 3
};

const sortingTypes = ['name', 'priority', 'status'];

let currentSortingType = 'name';
let reversedSorting = false;

function capitalize(text) {
    if (!text) return '';
    return text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function showMessage(message, type, duration) {
    if (!type) type = 'success';

    const deafultMsgBox = document.getElementById('default-msgbox');
    const newMsgBox = deafultMsgBox.cloneNode();

    deafultMsgBox.parentElement.insertBefore(newMsgBox, deafultMsgBox.nextSibling);

    newMsgBox.hidden = false;

    newMsgBox.innerHTML = message;
    newMsgBox.classList.add(type);
    newMsgBox.classList.remove('hidden');

    setTimeout(() => {
        newMsgBox.classList.add('hidden');
        setTimeout(() => {
            newMsgBox.remove();
        }, 600);
    }, duration*1000);
}

function checkIfSearched(taskCard) {
    const searchBox = document.getElementById('task-search-box');

    const entry = searchBox.value.toLowerCase();
    
    const title = taskCard.getElementsByClassName('task-title')[0].innerHTML.toLowerCase();
    const description = taskCard.getElementsByClassName('task-description')[0].innerHTML.toLowerCase();

    const match = (title.includes(entry) || description.includes(entry)) ? true : false;

    return match;
}

function checkIfFiltered(taskCard) {
    const filterPrioritySelect = document.getElementById('filter-priority-select');
    const filterStatusSelect = document.getElementById('filter-status-select');

    let selectedPriorities = Array.from(filterPrioritySelect.selectedOptions)
    .map(option => option.value)
    .filter(option => option !== 'any');

    if (selectedPriorities.length === 0) selectedPriorities = ['low', 'medium', 'high'];

    let selectedStatuses = Array.from(filterStatusSelect.selectedOptions)
    .map(option => option.value)
    .filter(option => option !== 'any');

    if (selectedStatuses.length === 0) selectedStatuses = ['todo', 'inprogress', 'completed'];

    const status = taskCard.getElementsByClassName('status-text')[0].innerHTML.toLowerCase().replace(/\s/g, '');
    const priority = taskCard.getElementsByClassName('priority-text')[0].innerHTML.toLowerCase().replace(/\s/g, '').replace('priority', '');

    const match = selectedPriorities.includes(priority) && selectedStatuses.includes(status);
    return match;
}

function nextSortingType() {
    const currentIndex = sortingTypes.indexOf(currentSortingType);
    
    const newIndex = (currentIndex + 1 >= sortingTypes.length) ? 0 : currentIndex + 1;

    currentSortingType = sortingTypes[newIndex];
}

function sort(type, reversed) {
    const tasks = document.getElementById('tasks');
    const items = Array.from(document.getElementsByClassName('task-card'));

    if (type == 'priority') {
        items.sort((a, b) => {
            // Sort by priority
            const priorityA = a.querySelector('#priority').innerHTML.toLowerCase().split(" ")[0];
            const priorityB = b.querySelector('#priority').innerHTML.toLowerCase().split(" ")[0];

            return priorityWeights[priorityB] - priorityWeights[priorityA];
        });
    } else if (type == 'status') {
        items.sort((a, b) => {
            // Sort by status
            const statusA = a.querySelector('#status').innerHTML.toLowerCase();
            const statusB = b.querySelector('#status').innerHTML.toLowerCase();

            return statusWeights[statusA] - statusWeights[statusB];
        });
    } else {
        // Sort by name
        items.sort((a, b) => {
            const titleA = a.querySelector('#title').innerHTML;
            const titleB = b.querySelector('#title').innerHTML;

            return titleA.localeCompare(titleB);
        });
    }

    if (reversed) {
        items.reverse();
    }

    tasks.innerHTML = '';
    items.forEach(item => tasks.appendChild(item));
}

function updateTaskList() {
    const allTaskCards = document.getElementsByClassName('task-card');

    let allHidden = true;

    Array.from(allTaskCards).forEach((taskCard) => {
        const matchesSearch = checkIfSearched(taskCard);
        const matchesFilter = checkIfFiltered(taskCard);
        taskCard.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
        
        if (allHidden) allHidden = taskCard.style.display == '' ? false : true;
    });

    if (allTaskCards.length > 0) {
        if (allHidden) document.getElementById('no-tasks-found').hidden = false;
        else document.getElementById('no-tasks-found').hidden = true;
    }
    
}

function setPopups(visibleOverlayId) {
    const overlays = document.querySelectorAll('.overlay');
    overlays.forEach(overlay => overlay.classList.add('hidden'));

    if (visibleOverlayId) {
        const overlay = document.getElementById(visibleOverlayId);
        overlay.classList.remove('hidden');
    }
}

addEventListener('DOMContentLoaded', event => {
    const taskCards = document.getElementsByClassName('task-card');
    
    for (const taskCard of taskCards) {
        // Task Buttons
        const taskButtons = taskCard.getElementsByClassName('task-buttons')[0].getElementsByClassName('task-button');

        for (const button of taskButtons) {
            const taskId = button.id;

            if (button.classList.contains('edit-button')) {
                button.addEventListener('click', (event) => editTask(Number(taskId)));
            }

            if (button.classList.contains('delete-button')) {
                button.addEventListener('click', (event) => deleteTask(Number(taskId)));
            }
        }

        // Task
        const task = taskCard.getElementsByClassName('task')[0];

        const taskId = task.id;
        const status = task.getElementsByClassName('status-text')[0].innerHTML.toLowerCase();

        allTaskButtons.set(Number(taskId), {taskCard: taskCard, task: task, status: status});
    }
    

    // Search

    const searchBox = document.getElementById('task-search-box');

    searchBox.addEventListener('input', updateTaskList);


    // Filter

    const applyFilterButton = document.getElementById('apply-filter');

    applyFilterButton.addEventListener('click', event => {
        updateTaskList();
        setPopups(null);
        showMessage(`Successfully applied filter.`, 'success', 2);
    });

    const filterButton = document.getElementById('filter-button');
    filterButton.addEventListener('click', event => {
        setPopups('overlay-filter');
    });

    const filterPrioritySelect = document.getElementById('filter-priority-select');
    const filterStatusSelect = document.getElementById('filter-status-select');

    for (const select of [filterPrioritySelect, filterStatusSelect]) {
        // Testing
        select.addEventListener('mousedown', event => {
            event.preventDefault();
            const option = event.target;
            if (option.tagName.toLowerCase() === 'option') {
                option.selected = !option.selected;

                if (option.value === 'any' && option.selected) {
                    Array.from(select.options).forEach(opt => {
                        if (opt.value !== 'any') opt.selected = false;
                    });
                }

                if (option.value !== 'any' && option.selected) {
                    const allOption = select.querySelector('option[value="any"]');
                    allOption.selected = false;
                }
            }
        });
    }

    // Add new task button
    const addNewTaskButton = document.getElementById('add-task-button');

    addNewTaskButton.addEventListener('click', event => {
        setPopups('overlay-new-task');
    });


    // Add new task popup
    const createNewTaskForm = document.getElementById('create-new-task-form');

    createNewTaskForm.addEventListener('submit', event => {
        event.preventDefault();

        if (event.target.checkValidity()) {
            const newTaskTitle = document.getElementById('create-task-title-input').value;
            const newTaskDescription = document.getElementById('create-task-description-input').value;
            const newTaskPriority = document.getElementById('create-task-priority-select').value;
            const newTaskDueDate = document.getElementById('create-task-datetime-input').value;

            fetch(`/api/v1/tasks/`, {
                method: 'POST',
                body: JSON.stringify({
                    title: newTaskTitle,
                    description: newTaskDescription,
                    priority: newTaskPriority,
                    due: new Date(newTaskDueDate).getTime() || null,
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(response => {
                if (!response.ok) {
                    console.log('Failed to create new task.');
                    return;
                }

                return response.json();
            })
            .then(data => {
                console.log(data);
                if (!data.success) {
                    console.log('Failed to create new task.');
                    showMessage('There was an error while creating the task. Please try again later or reload the page.', 'error', 5);
                    console.log(data.error);
                    return;
                } else {
                    window.location.reload();
                }
            });

        } else {
            createNewTaskForm.reportValidity();
        }
    });

    const cancelAddNewTaskButton = document.getElementById('cancel-add-new-task-button');

    cancelAddNewTaskButton.addEventListener('click', event => {
        setPopups(null);
    });

    // Sorting button
    const sortingButton = document.getElementById('sort-button');
    sortingButton.addEventListener('click', event => {
        nextSortingType();
        sort(currentSortingType, reversedSorting);
        showMessage(`Now sorting by ${reversedSorting ? 'reversed ' : ''}${capitalize(currentSortingType)}`, 'success', 2);
    });

    const reverseButton = document.getElementById('reverse-button');
    reverseButton.addEventListener('click', event => {
        reversedSorting = !reversedSorting;
        sort(currentSortingType, reversedSorting);
        showMessage(`Now sorting by ${reversedSorting ? 'reversed ' : ''}${capitalize(currentSortingType)}`, 'success', 2);
    });

    sort('name');
});

async function editTask(taskId) {
    const taskButton = allTaskButtons.get(Number(taskId));
    const currentStatus = taskButton.status;

    if (!currentStatus) {
        console.log(`Failed to edit task with id ${taskId}.`);
        return;
    }

    const index = statuses.indexOf(currentStatus);

    let newIndex = index + 1;
    if (index + 1 > 2) {
        newIndex = 0;
    }

    const newStatus = statuses[newIndex];
    
    let response;
    try {
        response = await fetch(`/api/v1/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'status': newStatus
            }),
        });
    } catch (error) {
        showMessage('There was an error while editing the task. Please try again later or reload the page.', 'error', 5);
        console.log(`Failed to edit task with id ${taskId}.`);
        console.log(error);
        return;
    }

    if (!response.ok) {
        showMessage('There was an error while editing the task. Please try again later or reload the page.', 'error', 5);
        console.log(`Failed to edit task with id ${taskId}.`);
        console.log(await response.json());
        return;
    }

    const jsonResponse = await response.json();

    if (!jsonResponse.success) {
        showMessage('There was an error while editing the task. Please try again later or reload the page.', 'error', 5);
        console.log(`Failed to edit task with id ${taskId}.`);
        console.log(jsonResponse.message);
        return;
    }

    // window.location.reload();

    const newStatusRaw = newStatus.toLowerCase().replace(' ', '');
    const task = taskButton.task;

    // Set main card status style
    Array.from(task.classList).forEach(className => {
        if (className.startsWith('status-')) task.classList.remove(className);
    });
    task.classList.add(`status-${newStatusRaw}`);

    // Set statusText style and text
    const statusText = task.getElementsByClassName('status-text')[0];
    statusText.classList.remove(statusText.classList[1]);
    statusText.classList.add(`${newStatusRaw}-text`);
    statusText.innerHTML = capitalize(newStatus);

    taskButton.status = newStatus;

    updateTaskList();
}

async function deleteTask(taskId) {
    const taskButton = allTaskButtons.get(Number(taskId));
    
    let response;
    try {
        response = await fetch(`/api/v1/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
        });
    } catch (error) {
        console.log(`Failed to delete task with id ${taskId}.`);
        showMessage('There was an error while deleting the task. Please try again later or reload the page.', 'error', 5);
        console.log(error);
        return;
    }

    if (!response.ok) {
        console.log(`Failed to delete task with id ${taskId}.`);
        showMessage('There was an error while deleting the task. Please try again later or reload the page.', 'error', 5);
        console.log(await response.json());
        return;
    }

    const jsonResponse = await response.json();

    if (!jsonResponse.success) {
        console.log(`Failed to delete task with id ${taskId}.`);
        showMessage('There was an error while deleting the task. Please try again later or reload the page.', 'error', 5);
        console.log(jsonResponse.message);
        return;
    }

    // window.location.reload();

    const task = taskButton.task;
    
    // Delete the card from the list and from the "cache"
    task.parentElement.remove();

    allTaskButtons.delete(Number(taskId));
}