import { existsSync } from "node:fs";

export function assertDirExists(dir: string): void {
  if (!existsSync(dir)) {
    console.error(`Error: directory does not exist: ${dir}`);
    process.exit(1);
  }
}
