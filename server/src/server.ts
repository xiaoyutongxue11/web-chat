import app from './app';
import pool from './config/database';

const PORT = process.env.PORT || 3000;

// 测试数据库连接
const testDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// 启动服务器
const startServer = async () => {
  await testDatabaseConnection();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
  });
};

startServer();
