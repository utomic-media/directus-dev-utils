# 🐰 Directus Dev-utils

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

## 🔧 Configuration
If you're building your extension with the directus extensions-sdk  you'll need to add the migrations older to the dist output of the build process. You can do that by installing [`rollup-plugin-copy`](https://www.npmjs.com/package/rollup-plugin-copy) in your extension and [add it as a plugin](https://docs.directus.io/extensions/creating-extensions.html#configuring-the-cli). The result will look like this:

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

## Usage
1. Add this module as a dev-dependency to your extension
2. Init the module: `const hookUtils = new HookUtils('<extensionName>', apiExtensionContext);`
3. Use the config and make your live easier

**Example:**
````ts
import { defineHook } from '@directus/extensions-sdk';
import { HookUtils } from 'directus-dev-utils';

export default defineHook(({ filter, action }, apiExtensionContext) => {
	action('server.start', () => {
		console.log('Server started');

		const hookUtils = new HookUtils('<extensionName>', apiExtensionContext);
		hookUtils.syncMigrations();
	});
});
````



## Development
- Add this as a file-dependency to a package-json of a directus-extension
- Run `pnpm i` on this repo
- Run `pnpm i` & `pmpm dev` on the extension
- Check in the directus project
- --> repeat