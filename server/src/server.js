import './config/loadEnv.js';

const [{ default: env }, { default: app }, { connectDB, disconnectDB }] = await Promise.all([
    import('./config/environment.js'),
    import('./app.js'),
    import('./config/database.js'),
]);

const PORT = env.port;

/**
 * Start the server
 */
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start Express server
        const server = app.listen(PORT, () => {
            console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🎬 MovieMania API Server                               ║
║                                                          ║
║   Environment: ${env.nodeEnv.padEnd(40)}                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
        });

        // Graceful shutdown
        const shutdown = async (signal) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);

            server.close(async () => {
                console.log('HTTP server closed');
                await disconnectDB();
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
