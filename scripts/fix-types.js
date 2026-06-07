const { Project, SyntaxKind } = require("ts-morph");

const project = new Project();
project.addSourceFilesAtPaths("app/api/**/*.ts");
project.addSourceFilesAtPaths("app/(store)/**/*.tsx");
project.addSourceFilesAtPaths("app/admin/**/*.tsx");

const files = project.getSourceFiles();

files.forEach(sourceFile => {
  let hasChanges = false;
  
  const functions = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionExpression)
  ];
  
  functions.forEach(func => {
    if (func.isAsync()) {
      const returnTypeNode = func.getReturnTypeNode();
      if (returnTypeNode) {
        const typeText = returnTypeNode.getText();
        if (!typeText.startsWith('Promise<') && typeText !== 'Promise<void>') {
          func.setReturnType(`Promise<${typeText}>`);
          hasChanges = true;
        }
      }
    }
  });

  if (hasChanges) {
     sourceFile.saveSync();
     console.log(`Fixed types in ${sourceFile.getFilePath()}`);
  }
});

console.log("Type fix complete!");
