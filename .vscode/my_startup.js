exports.execute = async (args) => {
  const vscode = args.require("vscode");
  setTimeout(5000);
  vscode.commands.executeCommand("codetour.startTour");
};
