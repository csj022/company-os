module.exports = {
  apps: [
    {
      name: 'company-os-api',
      cwd: './backend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'company-os-ui',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development'
      },
      watch: false,
      max_memory_restart: '300M'
    }
  ]
};
