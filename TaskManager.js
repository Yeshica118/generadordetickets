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
    fs.writeFileSync(this.fileName, JSON.stringify(this.tasks));
  }

  addTask(title, description) {
    const task = {
      id: this.tasks.length + 1,
      title: title,
      description: description,
      status: 'Pending',
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    
    this.tasks.push(task);
    this.saveTasks();
    console.log(`Task '${title}' added successfully!`);
  }

  listTasks() {
    if (this.tasks.length === 0) {
      console.log('No tasks found.');
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log(`${'ID'.padEnd(5)} ${'TITLE'.padEnd(20)} ${'STATUS'.padEnd(10)} ${'CREATED DATE'.padEnd(20)} ${'DESCRIPTION'.padEnd(30)}`);
    console.log('-'.repeat(80));

    for (const task of this.tasks) {
      console.log(
        `${String(task.id).padEnd(5)} ${task.title.substring(0, 18).padEnd(20)} ${task.status.padEnd(10)} ${task.createdDate.padEnd(20)} ${task.description.substring(0, 28).padEnd(30)}`
      );
    }
    
    console.log('='.repeat(80) + '\n');
  }

  markComplete(taskId) {
    for (const task of this.tasks) {
      if (task.id === taskId) {
        task.status = 'Completed';
        this.saveTasks();
        console.log(`Task '${task.title}' marked as completed!`);
        return;
      }
    }
    console.log(`Task with ID ${taskId} not found.`);
  }

  deleteTask(taskId) {
    for (let i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].id === taskId) {
        const removed = this.tasks.splice(i, 1)[0];
        this.saveTasks();
        console.log(`Task '${removed.title}' deleted successfully!`);
        return;
      }
    }
    console.log(`Task with ID ${taskId} not found.`);
  }
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Main application function
async function main() {
  const taskManager = new TaskManager();
  
  while (true) {
    console.log('\nTASK MANAGER');
    console.log('1. Add Task');
    console.log('2. List Tasks');
    console.log('3. Mark Task as Complete');
    console.log('4. Delete Task');
    console.log('5. Exit');
    
    const choice = await prompt('Enter your choice (1-5): ');
    
    if (choice === '1') {
      const title = await prompt('Enter task title: ');
      const description = await prompt('Enter task description: ');
      taskManager.addTask(title, description);
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
      taskManager.deleteTask(taskId);
    }
    else if (choice === '5') {
      console.log('Exiting Task Manager. Goodbye!');
      rl.close();
      break;
    }
    else {
      console.log('Invalid choice. Please try again.');
    }
  }
}

// Run the application
main().catch(error => {
  console.error('An error occurred:', error);
  rl.close();
});