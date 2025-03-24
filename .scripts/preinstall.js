// Check if the script is run with pnpm
if (process.env.npm_execpath && !process.env.npm_execpath.includes('pnpm')) {
  console.warn(
    '\x1b[33m%s\x1b[0m',
    `
    Warning: You're using ${process.env.npm_execpath.includes('yarn') ? 'Yarn' : 'NPM'} to install dependencies.
    This project uses pnpm for dependency management.
    Please run 'pnpm install' instead.
    You can install pnpm with 'npm install -g pnpm'.
    `
  );
  process.exit(1);
}
