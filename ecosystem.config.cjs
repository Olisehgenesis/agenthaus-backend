module.exports = {
    apps: [
        {
            name: "agenthaus-heartbeat",
            script: "./index.js",
            watch: false,
            env: {
                NODE_ENV: "production",
            }
        }
    ]
};
