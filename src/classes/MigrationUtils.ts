import { HookUtils } from './HookUtils';
import type { HookExtensionContext } from '@directus/extensions';
import { createError } from '@directus/errors';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


export class MigrationUtils extends HookUtils {

  extensionMigrationPath: string;
  directusMigrationsPath: string;

  constructor(extensionName: string, apiExtensionContext: HookExtensionContext) {
    super(extensionName, apiExtensionContext);
    const { env } = this.getContext();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    this.directusMigrationsPath = path.join(process.cwd(), env['MIGRATIONS_PATH'] || '/extensions/migrations');
    this.extensionMigrationPath = path.join(__dirname, '/migrations');
  }


  /**
   * Allows to sync migrations from a local extensions folder to the directus migrations folder
   * @since 0.0.1
   */
  public syncMigrations() {
    const { logger } = this.getContext();
    logger.info(this.getLoggerMessage(`Start syncing migrations for extension ${this.getExtensionName()}...`, '🚀'));

    try {
      
      const newMigrationFIles = this.getNewMigrationFiles();

      if (newMigrationFIles.length === 0) {
        logger.info(this.getLoggerMessage('No new migrations', 'ℹ️'));
        return;
      }

      // Copy each file to the migrations folder if it doesn't exist there yet
      newMigrationFIles.forEach((file) => {
        const sourceFilePath = path.join(this.extensionMigrationPath, file);
        const targetFilePath = path.join(this.directusMigrationsPath, file);
        
        fs.copyFileSync(sourceFilePath, targetFilePath);
        logger.info(this.getLoggerMessage(`Copied migration file: ${file}`, '✔️'));
      });

      logger.info(this.getLoggerMessage(`Syncing migrations completed...`, '✅'));
    } catch (error: any) {
      // TODO: test error
      const errorMessage = this.getLoggerMessage(`Syncing migrations failed: ${error.message}`, '❌');
      const MigrationsSyncFailed = createError('MIGRATION_SYNC_FAILED', errorMessage, 503);
      throw new MigrationsSyncFailed();
    }
  }

  
  private getMigrationFiles() {
    return fs.readdirSync(this.extensionMigrationPath);
  }

  
  private getNewMigrationFiles() {
    const migrationFiles = this.getMigrationFiles();
    const newMigrationFiles: string[] = [];

    migrationFiles.forEach((file) => {
      const targetFilePath = path.join(this.directusMigrationsPath, file);

      if (!fs.existsSync(targetFilePath)) {
        newMigrationFiles.push(file);
      }
    });

    return newMigrationFiles;
  }


  /**
   * Registers a cli command to the directus cli in order to sync all custom migrations to the directus migrations folder 
   */
  public registerMigrationCliCommand(program: any) {
    const devUtilsCommands = program.command('devUtils');

    const commandExists = devUtilsCommands.commands.find((command: any) => command._name === 'syncMigrations');
    if (commandExists) {
      return;
    }

    devUtilsCommands
			.command('syncMigrations')
			.description(
				'Emits the `syncMigration` event to all extensions using the dev-utils migrations tool. This should sync all custom migrations to the `migrations` folder.'
			)
			.action(async () => {
        const { logger, emitter } = this.getContext();
        
        logger.info(this.getLoggerMessage(`...Requested to sync all dev-utils based migrations to the migrations base-folder...`, '✅'));
				emitter.emitFilter('devUtils:syncMigrations');
        logger.info(this.getLoggerMessage("Don't forget to run the migrtions via `npx directus database migrate:latest`", '❕'));
      });
  }

}
