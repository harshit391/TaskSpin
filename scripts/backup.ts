import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  const backupDir = path.join(__dirname, "..", "backup");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const tasks = await prisma.task.findMany({ include: { project: true } });
  fs.writeFileSync(
    path.join(backupDir, `tasks_${timestamp}.json`),
    JSON.stringify(tasks, null, 2)
  );
  console.log(`Backed up ${tasks.length} tasks`);

  const projects = await prisma.project.findMany();
  fs.writeFileSync(
    path.join(backupDir, `projects_${timestamp}.json`),
    JSON.stringify(projects, null, 2)
  );
  console.log(`Backed up ${projects.length} projects`);

  const stats = await prisma.dailyStats.findMany();
  fs.writeFileSync(
    path.join(backupDir, `daily_stats_${timestamp}.json`),
    JSON.stringify(stats, null, 2)
  );
  console.log(`Backed up ${stats.length} daily stats records`);

  console.log(`\nBackup complete → ${backupDir}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
