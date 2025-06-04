const fs = require('fs');
const readline = require('readline');

class TaskManager {
  constructor() {
    this.tasks = [];
    this.fileName = 'tasks.json';
    this.loadTasks();
  }

  loadTasks() {
    if (fs.existsSync(this.fileName)) {
      try {
        const data = fs.readFileSync(this.fileName, 'utf8');
        this.tasks = JSON.parse(data);
      } catch (error) {
        console.log('Error loading task data. Starting with empty task list.');
        this.tasks = [];
      }
    }
  }

  saveTasks() {
    fs.writeFileSync(this.fileName, JSON.stringify(this.tasks, null, 2));
  }

  addTask(title, description, deadline) {
    const task = {
      id: this.tasks.length + 1,
      title,
      description,
      deadline: deadline || null,
      status: 'Pending',
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      deleted: false 
    };

    this.tasks.push(task);
    this.saveTasks();
    console.log(`Task '${title}' added successfully!`);
  }

  listTasks(filteredTasks = null, includeDeleted = false) {
    const tasksToShow = (filteredTasks || this.tasks).filter(task => includeDeleted || !task.deleted);

    if (tasksToShow.length === 0) {
      console.log('No tasks found.');
      return;
    }

    console.log('\n' + '='.repeat(100));
    console.log(`${'ID'.padEnd(5)} ${'TITLE'.padEnd(20)} ${'STATUS'.padEnd(10)} ${'CREATED DATE'.padEnd(20)} ${'DEADLINE'.padEnd(15)} ${'DESCRIPTION'.padEnd(25)}`);
    console.log('-'.repeat(100));

    for (const task of tasksToShow) {
      console.log(
        `${String(task.id).padEnd(5)} ${task.title.substring(0, 18).padEnd(20)} ${task.status.padEnd(10)} ${task.createdDate.padEnd(20)} ${String(task.deadline || 'N/A').padEnd(15)} ${task.description.substring(0, 23).padEnd(25)}`
      );
    }

    console.log('='.repeat(100) + '\n');
  }

  markComplete(taskId) {
    const task = this.tasks.find(t => t.id === taskId && !t.deleted);
    if (task) {
      task.status = 'Completed';
      this.saveTasks();
      console.log(`Task '${task.title}' marked as completed!`);
    } else {
      console.log(`Task with ID ${taskId} not found.`);
    }
  }

  async deleteTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId && !t.deleted);
    if (!task) {
      console.log(`Task with ID ${taskId} not found or already deleted.`);
      return;
    }

    const confirmation = await prompt(`Are you sure you want to delete task '${task.title}'? (s/n): `);
    if (confirmation.toLowerCase() === 's') {
      task.deleted = true;
      this.saveTasks();
      console.log(`Task '${task.title}' moved to recycle bin.`);
    } else {
      console.log('Deletion canceled.');
    }
  }

  searchTasks(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    const filtered = this.tasks.filter(task =>
      !task.deleted &&
      (task.title.toLowerCase().includes(lowerKeyword) ||
       task.description.toLowerCase().includes(lowerKeyword))
    );

    this.listTasks(filtered);
  }

  listRecycleBin() {
    const deletedTasks = this.tasks.filter(task => task.deleted);
    this.listTasks(deletedTasks, true);
  }

  restoreTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId && t.deleted);
    if (task) {
      task.deleted = false;
      this.saveTasks();
      console.log(`Task '${task.title}' restored from recycle bin.`);
    } else {
      console.log(`Task with ID ${taskId} not found in recycle bin.`);
    }
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  const taskManager = new TaskManager();

  while (true) {
    console.log('\nTASK MANAGER');
    console.log('1. Add Task');
    console.log('2. List Tasks');
    console.log('3. Mark Task as Complete');
    console.log('4. Delete Task');
    console.log('5. Search Tasks by Keyword');
    console.log('6. View Recycle Bin');
    console.log('7. Restore Task from Recycle Bin');
    console.log('8. Exit');

    const choice = await prompt('Enter your choice (1-8): ');

    if (choice === '1') {
      const title = await prompt('Enter task title: ');
      const description = await prompt('Enter task description: ');
      const deadline = await prompt('Enter deadline (YYYY-MM-DD) or leave blank: ');
      taskManager.addTask(title, description, deadline.trim() || null);
    }
    else if (choice === '2') {
      taskManager.listTasks();
    }
    else if (choice === '3') {
      const taskId = parseInt(await prompt('Enter task ID to mark as complete: '));
      taskManager.markComplete(taskId);
    }
    else if (choice === '4') {
      const taskId = parseInt(await prompt('Enter task ID to delete: '));
      await taskManager.deleteTask(taskId);
    }
    else if (choice === '5') {
      const keyword = await prompt('Enter keyword to search in title/description: ');
      taskManager.searchTasks(keyword);
    }
    else if (choice === '6') {
      taskManager.listRecycleBin();
    }
    else if (choice === '7') {
      const taskId = parseInt(await prompt('Enter task ID to restore: '));
      taskManager.restoreTask(taskId);
    }
    else if (choice === '8') {
      console.log('Exiting Task Manager. Goodbye!');
      rl.close();
      break;
    }
    else {
      console.log('Invalid choice. Please try again.');
    }
  }
}

main().catch(error => {
  console.error('An error occurred:', error);
  rl.close();
});
