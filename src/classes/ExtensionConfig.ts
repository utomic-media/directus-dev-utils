import ts from "typescript";
import type { CopyOptions } from "rollup-plugin-copy";


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
          rename: (name, _extension, _fullPath: any) => `${name}.js`
        }
      ]
    };

    return config;
  }
}