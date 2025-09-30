module.exports = {
  apps: [
    {
      name: 'wosh-server',
      script: './dist/src/main.js',
      env_file: './.env',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=460 --optimize-for-size',

      // Logging
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Auto-restart settings
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
