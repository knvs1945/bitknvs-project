module.exports = {
  apps: [{
    name: "bitknvs_home",
    script: "./server.js",
    env: {
      NODE_ENV: "development"
    },
    env_production: {
      NODE_ENV: "production",
      DB_HOST: "localhost",
      DB_PORT: 5432,
      DB_NAME: "spykeball",
      DB_USER: "bitknvs",
      DB_PASSWORD: "TheDefender45"
    }
  }]
}