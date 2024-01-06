import type { HookExtensionContext } from '@directus/extensions';
import { createError } from '@directus/errors';
import { defu } from "defu";


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
  public requireEnv(name: string, _options?: { throwError?: boolean }) {
    const { logger, env } = this.getContext();

    const options = defu(_options, {
      throwError: false,
    });
  
    if (!env[name]) {
      const errorMessage = this.getLoggerMessage(`Required env-variable '${name}' is missing`);
      logger.error(errorMessage);

      if (options.throwError) {
        const InvalidConfigException = createError('INVALID_CONFIG', errorMessage, 503);
        throw new InvalidConfigException;
      }
    }
  }


  protected getLoggerMessage(message: string, messagePrefix='') {
    return `${messagePrefix} [${this.getExtensionName()}] [DEV-UTILS]: ${message}`;
  }


  public async requireExtension(extensionBundle: string | null, extensionName: string, _options?: { throwError?: boolean }) {
    const { services, logger, database, getSchema } = this.apiExtensionContext;
    const { ExtensionsService } = services;
    const schema = await getSchema();

    const options = defu(_options, {
      throwError: false,
    });

    const extensionsService = new ExtensionsService({
      knex: database,
      accountability: {
        admin: true, // use admin accountability to allow extensions read
      },
      schema: schema,
    });
    const extension = await extensionsService.readOne(extensionBundle, extensionName);

    if (!extension) {
      const errorMessage = this.getLoggerMessage(`Required extension is missing: ${extensionBundle}/${extensionName}`)
      logger.error(errorMessage);

      if (options.throwError) {
        const ExtensionNotFoundException = createError('EXTENSION_NOT_FOUND', errorMessage, 503);
        throw new ExtensionNotFoundException;
      }
      return false;
    }

    if (!extension.meta.enabled) {
      const errorMessage = this.getLoggerMessage(`Required extension is disabled: ${extensionBundle}/${extensionName}`)
      logger.error(errorMessage);

      if (options.throwError) {
        const ExtensionDisabledException = createError('EXTENSION_DISABLED', errorMessage, 503);
        throw new ExtensionDisabledException;
      }
      return false;
    }

    return true;
  }
}
