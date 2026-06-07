const { Project, SyntaxKind } = require("ts-morph");

const project = new Project();
project.addSourceFilesAtPaths("app/api/**/*.ts");
project.addSourceFilesAtPaths("app/(store)/**/*.tsx");
project.addSourceFilesAtPaths("app/admin/**/*.tsx");

const files = project.getSourceFiles();

files.forEach(sourceFile => {
  let hasChanges = false;
  
  // Find all db.prepare() calls
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  callExpressions.forEach(callExpr => {
    const expr = callExpr.getExpression();
    
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr;
      const propName = propAccess.getName();
      
      if (['get', 'all', 'run'].includes(propName)) {
        const prepareCall = propAccess.getExpression();
        if (prepareCall.getKind() === SyntaxKind.CallExpression) {
          const prepareExpr = prepareCall.getExpression();
          if (prepareExpr.getKind() === SyntaxKind.PropertyAccessExpression) {
            if (prepareExpr.getName() === 'prepare' && prepareExpr.getExpression().getText() === 'db') {
              
              const sqlArg = prepareCall.getArguments()[0];
              const execArgs = callExpr.getArguments();
              
              let newReplacement = '';
              
              if (execArgs.length > 0) {
                // Determine if args contain spread operator (...args)
                const hasSpread = execArgs.some(a => a.getKind() === SyntaxKind.SpreadElement);
                if (hasSpread) {
                   const spreadText = execArgs.map(a => a.getText()).join(', ');
                   newReplacement = `await db.execute({ sql: ${sqlArg.getText()}, args: [${spreadText}] })`;
                } else {
                   const argsArray = `[${execArgs.map(a => a.getText()).join(', ')}]`;
                   newReplacement = `await db.execute({ sql: ${sqlArg.getText()}, args: ${argsArray} })`;
                }
              } else {
                newReplacement = `await db.execute(${sqlArg.getText()})`;
              }
              
              if (propName === 'get') {
                newReplacement = `(${newReplacement}).rows[0]`;
              } else if (propName === 'all') {
                newReplacement = `(${newReplacement}).rows`;
              }
              
              callExpr.replaceWithText(newReplacement);
              hasChanges = true;
            }
          }
        }
      }
    }
  });
  
  // Now add async to functions containing await if they aren't async
  if (hasChanges) {
     const awaits = sourceFile.getDescendantsOfKind(SyntaxKind.AwaitExpression);
     awaits.forEach(awaitExpr => {
       const func = awaitExpr.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) || 
                    awaitExpr.getFirstAncestorByKind(SyntaxKind.ArrowFunction) ||
                    awaitExpr.getFirstAncestorByKind(SyntaxKind.FunctionExpression);
                    
       if (func && !func.isAsync()) {
          func.setIsAsync(true);
       }
     });
     
     sourceFile.saveSync();
     console.log(`Refactored ${sourceFile.getFilePath()}`);
  }
});

console.log("Refactoring complete!");
