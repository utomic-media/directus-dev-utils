import type { HookExtensionContext } from '@directus/extensions';
import { createError } from '@directus/errors';

export class HookUtils {

  extensionName: string;
  apiExtensionContext: HookExtensionContext;

  constructor(extensionName: string, apiExtensionContext: HookExtensionContext) {
    this.extensionName = extensionName;
    this.apiExtensionContext = apiExtensionContext;
  }

  /**
   * Get the name of the extension, that includes the dev utils
   * @since 0.0.1
   */
  public getExtensionName(): string {
    return this.extensionName;
  }


  /**
   * Get the context of the extension, that includes the dev utils
   * @since 0.0.1
   */
  protected getContext() {
    return this.apiExtensionContext;
  }


  /**
   * Makes sure an env required by the extension is set
   * @since 0.0.1
   */
  public requireEnv(name: string) {
    const { logger, env } = this.getContext();
  
    if (!env[name]) {
      // TODO: make add strictness parameter: Log error vs throw error / cancle server start
      const errorMessage = this.getLoggerMessage(`Required env-variable '${name}' is missing`);
      const InvalidConfigException = createError('INVALID_CONFIG', errorMessage, 503)
      logger.error(errorMessage);
      throw new InvalidConfigException;
    }
  }


  protected getLoggerMessage(message: string, messagePrefix='') {
    return `${messagePrefix} [${this.getExtensionName()}] [DEV-UTILS]: ${message}`;
  }


  public async requireExtension(extensionBundle: string | null, extensionName: string) {
    const { services, logger, database, getSchema } = this.apiExtensionContext;
    const { ExtensionsService } = services;
    const schema = await getSchema();

    const extensionsService = new ExtensionsService({
      knex: database,
      accountability: {
        admin: true, // use admin accountability to allow extensions read
      },
      schema: schema,
    });
    const extension = await extensionsService.readOne(extensionBundle, extensionName);

    if (!extension) {
      logger.error(this.getLoggerMessage(`Required extension is missing: ${extensionBundle}/${extensionName}`));
      return false;
    }

    if (!extension.meta.enabled) {
      logger.error(this.getLoggerMessage(`Required extension is disabled: ${extensionBundle}/${extensionName}`));
      return false;
    }

    return true;
  }
}
