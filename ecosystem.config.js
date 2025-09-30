module.exports = {
  apps: [
    {
      name: 'wosh-server',
      script: './dist/src/main.js',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '460M',
      node_args: '--max-old-space-size=460 --optimize-for-size',
    },
  ],
};
