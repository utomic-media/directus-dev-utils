import type { HookExtensionContext, ApiOutput } from '@directus/extensions';
import { createError } from '@directus/errors';
import { defu } from "defu";


export type RequireExtensionOptions = {
  throwError?: boolean
};

export type RequireEnvOptions = {
  throwError?: boolean
};

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
  public requireEnv(name: string, _options?: RequireEnvOptions) {
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


  public async requireExtension(extensionName: string, extensionBundle: string | null, _options?: RequireExtensionOptions) {
    const { services, database, getSchema } = this.apiExtensionContext;
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


    // NOTE: findOne would be more persormant in case we have a lot of extensions, but as it doesn't exist (on v10.10.5), we use readAll instead
    // as we won't check this often, and there shouldn't be too much extensions it should be okay
    const extensions: ApiOutput[] = await extensionsService.readAll();
    
    let bundleID: string | null = null;

    if (extensionBundle) {
      const bundle = extensions.find((ext) => ext.schema?.name === extensionBundle) || null;

      // Missing bundle
      if (!bundle) {
        const errorMessage = this.getLoggerMessage(`Required bundle is missing: ${extensionBundle}/${extensionName}`);
        await this.logMissingextension(errorMessage, options);
        return false;
      }

      // Disabled bundle
      if (bundle && !bundle.meta.enabled) {
        const errorMessage = this.getLoggerMessage(`Required bundle is disabled: ${extensionBundle}/${extensionName}`);
        await this.logMissingextension(errorMessage, options);
        return false;
      }

      bundleID = bundle.id;
    }
    
    // find the extension with the given name and the given ID 
    // NOTE: if it's not part of a bundle, the ID MUST! be null
    const extension: ApiOutput|null = extensions.find((ext) => ext.schema?.name === extensionName && ext.bundle === bundleID) || null;

    if (!extension) { 
      const errorMessage = this.getLoggerMessage(`Required extension is missing: ${extensionBundle}/${extensionName}`);
      await this.logMissingextension(errorMessage, options);
      return false;
    }

    if (!extension.meta.enabled) {
      const errorMessage = this.getLoggerMessage(`Required extension is disabled: ${extensionBundle}/${extensionName}`);
      await this.logMissingextension(errorMessage, options);
      return false;
    }

    return true;
  }



  private async logMissingextension(message: string, options: RequireExtensionOptions) {
    const { logger } = this.getContext();
    logger.error(message);

    if (options.throwError) {
      const MissingExtensionError = createError('EXTENSION_DISABLED', message, 503);
      throw new MissingExtensionError;
    }
  }
}
