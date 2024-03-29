import { HookUtils } from './HookUtils';
import type { HookExtensionContext } from '@directus/extensions';
import { createError } from '@directus/errors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RegisterFunctions } from '../types';


// @see https://github.com/directus/directus/blob/main/api/src/types/migration.ts
type Migration = {
	version: string;
	name: string;
	timestamp: Date;
};


export class MigrationUtils extends HookUtils {

  extensionMigrationPath: string;
  directusMigrationsPath: string;
  registerFunctions: RegisterFunctions;

  constructor(extensionName: string, registerFunctions: RegisterFunctions, apiExtensionContext: HookExtensionContext) {
    super(extensionName, apiExtensionContext);
    const { env } = this.getContext();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    this.directusMigrationsPath = path.join(process.cwd(), env['MIGRATIONS_PATH'] || '/extensions/migrations');
    this.extensionMigrationPath = path.join(__dirname, '/migrations');
    this.registerFunctions = registerFunctions;
  }


  /**
   * Inits the migration utils cli, emitter & actions
   * @since 0.0.1
   */
  public initMigrationUtils() {
    const { init, action } = this.registerFunctions;
    const { emitter } = this.getContext();

    init('cli.before', async ({ program }) => {
      this.registerMigrationCliCommand(program);
    });
  
    emitter.onFilter('devUtils:syncMigrations', async () => {
      this.syncMigrations();
    });
  
    action('server.start', () => {
      this.requireMigrations();
    })
  }


  /**
   * Allows to sync migrations from a local extensions folder to the directus migrations folder
   * @since 0.0.1
   */
  private syncMigrations() {
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
  private registerMigrationCliCommand(program: any) {
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
        try {        
          logger.info(this.getLoggerMessage(`...Requested to sync all dev-utils based migrations to the migrations base-folder...`, '✅'));
          emitter.emitFilter('devUtils:syncMigrations');
          logger.info(this.getLoggerMessage("Don't forget to run the migrtions via `npx directus database migrate:latest`", '❕'));
          process.exit();
        }
        catch (error: any) {
          logger.error(this.getLoggerMessage(`Syncing migrations failed: ${error}`, '❌'));
          process.exit(1);
        }
      });
  }


  /**
   * Makes sure that the migrations have been run. Can be called on server-start to warn users about missing migrations
   * @since 0.0.1
   */
  private async requireMigrations() {
    const { database } = this.getContext();
    const completedMigrations = await database.select<Migration[]>('*').from('directus_migrations').orderBy('version');
    const migrationFiles = this.getMigrationFiles();

    const missingMigrations = [] as string[];

    migrationFiles.forEach((filePath) => {
      // @see https://github.com/directus/directus/blob/main/api/src/database/migrations/run.ts#L43
      const version = filePath.split('-')[0];
      // const name = formatTitle(filePath.split('-').slice(1).join('_').split('.')[0]!);
      const completed = !!completedMigrations.find((migration: Migration) => migration.version === version);

      if (!completed) {
        missingMigrations.push(filePath);
      }
      return;
    });

    if (missingMigrations.length > 0) {
      const errorMessage = this.getLoggerMessage(`There are missing migrations: ${missingMigrations.join(', ')}`, '❌');
      const MissingMigrationsException = createError('MISSING_MIGRATIONS', errorMessage, 503);
      throw new MissingMigrationsException();
    }
  }
}
