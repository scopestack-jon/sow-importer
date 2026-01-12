#!/usr/bin/env npx tsx
/**
 * Ralph - Autonomous feature development agent
 * 
 * Runs iterations picking up tasks from the task list,
 * executing them via Amp, and marking them complete.
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const SCRIPTS_DIR = path.dirname(new URL(import.meta.url).pathname);
const PARENT_TASK_ID_FILE = path.join(SCRIPTS_DIR, 'parent-task-id.txt');
const PROGRESS_FILE = path.join(SCRIPTS_DIR, 'progress.txt');

function getParentTaskId(): string {
  if (!fs.existsSync(PARENT_TASK_ID_FILE)) {
    console.error('Error: parent-task-id.txt not found. Run ralph setup first.');
    process.exit(1);
  }
  return fs.readFileSync(PARENT_TASK_ID_FILE, 'utf-8').trim();
}

function appendProgress(message: string): void {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(PROGRESS_FILE, `\n[${timestamp}] ${message}\n`);
}

function runAmpCommand(args: string[]): string {
  try {
    const result = execSync(`amp ${args.join(' ')}`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return result;
  } catch (error: any) {
    return error.stdout || error.message;
  }
}

function getReadyTasks(parentId: string): any[] {
  try {
    const result = execSync(
      `amp tools use task_list --action list --parentID "${parentId}" --ready true --limit 5`,
      { encoding: 'utf-8' }
    );
    const parsed = JSON.parse(result);
    return parsed.tasks || [];
  } catch {
    return [];
  }
}

function checkAllTasksComplete(parentId: string): boolean {
  try {
    const result = execSync(
      `amp tools use task_list --action list --parentID "${parentId}" --limit 50`,
      { encoding: 'utf-8' }
    );
    const parsed = JSON.parse(result);
    const tasks = parsed.tasks || [];
    return tasks.length > 0 && tasks.every((t: any) => t.status === 'completed');
  } catch {
    return false;
  }
}

async function runIteration(taskId: string, taskTitle: string): Promise<boolean> {
  console.log(`\n🔨 Working on: ${taskTitle} (${taskId})`);
  appendProgress(`Started: ${taskTitle} (${taskId})`);

  const prompt = `
You are Ralph, an autonomous development agent. Complete this task:

Task ID: ${taskId}
Task: ${taskTitle}

Instructions:
1. Use task_list with action "get" and taskID "${taskId}" to get full task details
2. Read the task description carefully
3. Implement the task following all acceptance criteria
4. Run any verification commands mentioned (npm run typecheck, etc.)
5. When complete, use task_list with action "update", taskID "${taskId}", and status "completed"
6. If you cannot complete the task, update it with status "blocked" and add notes

Read progress.txt at scripts/ralph/progress.txt for codebase patterns from previous iterations.
After completing, append any new patterns you discovered to progress.txt.

When fully complete, output: <promise>TASK_COMPLETE</promise>
If all subtasks are done and parent should be marked complete, output: <promise>COMPLETE</promise>
`;

  return new Promise((resolve) => {
    const amp = spawn('amp', ['--dangerously-allow-all', '-x', prompt], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    let output = '';

    amp.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    amp.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });

    amp.on('close', (code) => {
      const isComplete = output.includes('<promise>COMPLETE</promise>');
      const taskComplete = output.includes('<promise>TASK_COMPLETE</promise>') || isComplete;
      
      if (taskComplete) {
        appendProgress(`Completed: ${taskTitle} (${taskId})`);
        console.log(`\n✅ Completed: ${taskTitle}`);
      } else {
        appendProgress(`Iteration ended without completion: ${taskTitle} (${taskId})`);
        console.log(`\n⚠️ Iteration ended: ${taskTitle}`);
      }

      resolve(isComplete);
    });
  });
}

async function main() {
  const maxIterations = parseInt(process.argv[2] || '10', 10);
  const parentId = getParentTaskId();

  console.log(`🚀 Ralph starting with parent task: ${parentId}`);
  console.log(`📊 Max iterations: ${maxIterations}`);
  appendProgress(`Ralph started. Parent: ${parentId}, Max iterations: ${maxIterations}`);

  for (let i = 0; i < maxIterations; i++) {
    console.log(`\n--- Iteration ${i + 1}/${maxIterations} ---`);

    // Check if all tasks complete
    if (checkAllTasksComplete(parentId)) {
      console.log('\n🎉 All tasks complete! Marking parent as complete.');
      execSync(
        `amp tools use task_list --action update --taskID "${parentId}" --status completed`,
        { encoding: 'utf-8' }
      );
      appendProgress('All tasks complete. Parent marked complete.');
      console.log('<promise>COMPLETE</promise>');
      break;
    }

    // Get ready tasks
    const readyTasks = getReadyTasks(parentId);
    
    if (readyTasks.length === 0) {
      console.log('No ready tasks. Checking if blocked or waiting...');
      appendProgress('No ready tasks found. Waiting...');
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    // Pick first ready task
    const task = readyTasks[0];
    const isAllComplete = await runIteration(task.id, task.title);

    if (isAllComplete) {
      console.log('\n🎉 Feature complete!');
      break;
    }
  }

  console.log('\n👋 Ralph finished.');
}

main().catch(console.error);
