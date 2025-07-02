const fs = require('fs');
const readline = require('readline');
const pool = require('./db');

class TaskManager {
  constructor() {
    this.fileName = 'tasks.json';
    this.tasks = [];
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

  async addTask(title, description, deadline) {
    try {
      await pool.query(
        `INSERT INTO tasks (title, description, deadline, status, created_date, deleted)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)`,
        [title, description, deadline || null, 'Pending', false]
      );
      console.log(` Tarea '${title}' añadida correctamente a la base de datos.`);
    } catch (error) {
      console.error(' Error al añadir la tarea:', error.message);
    }
  }

  async listTasks() {
    try {
      const result = await pool.query(`
        SELECT id, title, status, created_date, deadline, description 
        FROM tasks 
        WHERE deleted = FALSE
        ORDER BY created_date DESC
      `);

      const tasks = result.rows;

      if (tasks.length === 0) {
        console.log('No tasks found.');
        return;
      }

      console.log('\n' + '='.repeat(100));
      console.log(`${'ID'.padEnd(5)} ${'TITLE'.padEnd(20)} ${'STATUS'.padEnd(10)} ${'CREATED DATE'.padEnd(20)} ${'DEADLINE'.padEnd(15)} ${'DESCRIPTION'.padEnd(25)}`);
      console.log('-'.repeat(100));

      for (const task of tasks) {
        console.log(
          `${String(task.id).padEnd(5)} ${task.title.substring(0, 18).padEnd(20)} ${task.status.padEnd(10)} ${task.created_date.toISOString().slice(0, 19).replace('T', ' ').padEnd(20)} ${String(task.deadline || 'N/A').padEnd(15)} ${task.description.substring(0, 23).padEnd(25)}`
        );
      }

      console.log('='.repeat(100) + '\n');

    } catch (error) {
      console.error(' Error al listar tareas:', error.message);
    }
  }

  async markComplete(taskId) {
    try {
      const result = await pool.query(
        `UPDATE tasks 
         SET status = 'Completed' 
         WHERE id = $1 AND deleted = FALSE 
         RETURNING title`,
        [taskId]
      );

      if (result.rowCount === 0) {
        console.log(` No se encontró una tarea activa con ID ${taskId}.`);
      } else {
        console.log(` Tarea '${result.rows[0].title}' marcada como completada.`);
      }
    } catch (error) {
      console.error(' Error al marcar como completada:', error.message);
    }
  }

  async deleteTask(taskId) {
    try {
      const result = await pool.query(
        `UPDATE tasks 
         SET deleted = TRUE 
         WHERE id = $1 AND deleted = FALSE 
         RETURNING title`,
        [taskId]
      );

      if (result.rowCount === 0) {
        console.log(` No se encontró una tarea activa con ID ${taskId}.`);
      } else {
        console.log(` Tarea '${result.rows[0].title}' marcada como eliminada.`);
      }
    } catch (error) {
      console.error(' Error al eliminar la tarea:', error.message);
    }
  }

  async listDeletedTasks() {
    try {
      const result = await pool.query(`
        SELECT id, title, status, created_date, deadline, description 
        FROM tasks 
        WHERE deleted = TRUE
        ORDER BY created_date DESC
      `);

      const tasks = result.rows;

      if (tasks.length === 0) {
        console.log(' No hay tareas en la papelera.');
        return;
      }

      console.log('\n TAREAS EN PAPELERA');
      console.log('='.repeat(100));
      console.log(`${'ID'.padEnd(5)} ${'TITLE'.padEnd(20)} ${'STATUS'.padEnd(10)} ${'CREATED DATE'.padEnd(20)} ${'DEADLINE'.padEnd(15)} ${'DESCRIPTION'.padEnd(25)}`);
      console.log('-'.repeat(100));

      for (const task of tasks) {
        console.log(
          `${String(task.id).padEnd(5)} ${task.title.substring(0, 18).padEnd(20)} ${task.status.padEnd(10)} ${task.created_date.toISOString().slice(0, 19).replace('T', ' ').padEnd(20)} ${String(task.deadline || 'N/A').padEnd(15)} ${task.description.substring(0, 23).padEnd(25)}`
        );
      }

      console.log('='.repeat(100) + '\n');

    } catch (error) {
      console.error(' Error al mostrar la papelera:', error.message);
    }
  }

  async restoreTask(taskId) {
    try {
      const result = await pool.query(
        `UPDATE tasks 
         SET deleted = FALSE 
         WHERE id = $1 AND deleted = TRUE 
         RETURNING title`,
        [taskId]
      );

      if (result.rowCount === 0) {
        console.log(` No se encontró una tarea eliminada con ID ${taskId}.`);
      } else {
        console.log(` Tarea restaurada: '${result.rows[0].title}'.`);
      }
    } catch (error) {
      console.error(' Error al restaurar la tarea:', error.message);
    }
  }

  searchTasks(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    const filtered = this.tasks.filter(task =>
      task.title.toLowerCase().includes(lowerKeyword) ||
      task.description.toLowerCase().includes(lowerKeyword)
    );
    this.listTasks(filtered);
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
    console.log('5. Exit');
    console.log('6. Search Tasks by Keyword');
    console.log('7. View Deleted Tasks');
    console.log('8. Restore Deleted Task');

    const choice = await prompt('Enter your choice (1-8): ');

    if (choice === '1') {
      const title = await prompt('Enter task title: ');
      const description = await prompt('Enter task description: ');
      const deadline = await prompt('Enter deadline (YYYY-MM-DD) or leave blank: ');
      await taskManager.addTask(title, description, deadline.trim() || null);
    }
    else if (choice === '2') {
      await taskManager.listTasks();
    }
    else if (choice === '3') {
      const taskId = parseInt(await prompt('Enter task ID to mark as complete: '));
      await taskManager.markComplete(taskId);
    }
    else if (choice === '4') {
      const taskId = parseInt(await prompt('Enter task ID to delete: '));
      await taskManager.deleteTask(taskId);
    }
    else if (choice === '5') {
      console.log('Exiting Task Manager. Goodbye!');
      rl.close();
      break;
    }
    else if (choice === '6') {
      const keyword = await prompt('Enter keyword to search in title/description: ');
      taskManager.searchTasks(keyword);
    }
    else if (choice === '7') {
      await taskManager.listDeletedTasks();
    }
    else if (choice === '8') {
      const taskId = parseInt(await prompt('Enter ID of task to restore: '));
      await taskManager.restoreTask(taskId);
    }
    else {
      console.log('Invalid choice. Please try again.');
    }
  }
}

main().catch(error => {
  console.error('An error :', error);
  rl.close();
});
