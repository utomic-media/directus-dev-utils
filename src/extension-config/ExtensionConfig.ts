import ts from "typescript";
import type { CopyOptions } from "rollup-plugin-copy";


/**
 * ExtensionConfig is a helper class prodividing the needed configuration to the directus-extensions-sdk rolup extension config
 * !! NOTE: DO NOT MOVE THIS CLASS TO THE DEFAULT BUNDLE OF THIS PACKAGE !!
 * !!      This will will cause the directus-extensions-sdk to be bundled it into the extensions output (including TYPESCRIPT!!)
 */
export class ExtensionConfig {

  public compileTs(input: string) { 
    const compilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    };
  
    const result = ts.transpileModule(input, { compilerOptions });
  
    if (result.diagnostics && result.diagnostics.length > 0) {
        // Handle compilation errors
        const errors = result.diagnostics.map(diagnostic => {
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
          if (diagnostic.file) {
            const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start as number);
            console.error(`Error ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
          } else {
            console.error(`Error: ${message}`);
          }
        });
        throw new Error(errors.join('\n'));
    }
  
    return result.outputText;
  }

  
  public getRollupCopyConfig() {
    const config: CopyOptions = {
      targets: [
        {
          src: 'src/migrations/**/*.js',
          dest: 'dist/migrations',
        },
        {
          src: 'src/migrations/**/*.ts',
          dest: 'dist/migrations',
          transform: (contents, _filename) => this.compileTs(contents.toString()),
          rename: (name, _extension, _fullPath) => `${name}.js`
        }
      ]
    };

    return config;
  }
}