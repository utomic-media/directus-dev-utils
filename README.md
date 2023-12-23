![](./docs/Directus-Dev-Utils.png)

# 🐰 Directus Dev-utils

> [!NOTE]
> 💡 Some helpful utils when developing directus extensions.

**NOTE: THIS IS NOT A EXTENSION ITSELF! IT'S A DEV-UTIL THAT CAN BE USED BY DEVELOPERS WHILE CREATING EXTENSIONS!**

## 🎉 Features
- Add migrations from an extension
- Require extensions
- Require environmental variables


## ⚙️ Installation
```
npm i -D directus-dev-utils
```

or

```
pnpm i -D directus-dev-utils
```


## Usage
1. Add this module as a dev-dependency to your extension
2. Add a `migrations` folder to your extensions `src` folder (see [#configuration](#-configuration))
3. Init the module in your extension: `const hookUtils = new HookUtils('<extensionName>', apiExtensionContext);`
4. Register the CLI commands and add the emit-watcher
5. Use the utils and make your live easier

**Example:**
````ts
import { defineHook } from '@directus/extensions-sdk';
import { HookExtensionContext } from '@directus/extensions';
import { MigrationUtils } from 'directus-dev-utils';


export default defineHook(({ filter, action, init }, apiExtensionContext: HookExtensionContext) => {
	const { emitter } = apiExtensionContext;
	const migrationUtils = new MigrationUtils('gravatar', apiExtensionContext);

	init('cli.before', async ({ program }) => {
		migrationUtils.registerMigrationCliCommand(program);
	});

	emitter.onFilter('devUtils:syncMigrations', async () => {
		migrationUtils.syncMigrations();
	});

});
````

### Creating migrations
To create a migration add a new file to your extensions `migrations` folder. Make sure to use a unique name.
Directus requires the schema: `[identifier]-[name].js` [(read docs)](https://docs.directus.io/extensions/migrations.html#file-name)

We recommend to use your extension-name as a prefix for the name. For example: `20231202A-myExtension-my-custom-migration.js`


## 🔧 Configuration
If you're building your extension with the directus extensions-sdk  you'll need to create and add the migrations folder to the dist output of the build process. You can do that by installing [`rollup-plugin-copy`](https://www.npmjs.com/package/rollup-plugin-copy) in your extension and [add it as a plugin](https://docs.directus.io/extensions/creating-extensions.html#configuring-the-cli). The result will look like this:

````ts
// extension.config.js

import copy from 'rollup-plugin-copy'

export default {
  plugins: [
    copy({
      targets: [
        { src: 'src/migrations/**/*', dest: 'dist/migrations' }
      ]
    })
  ],
};
````


## Development
- Add this as a file-dependency to a package-json of a directus-extension
- Run `pnpm i` on this repo
- Run `pnpm i` & `pmpm dev` on the extension
- Check in the directus project
- --> repeat