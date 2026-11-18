import express from 'express';
import http from 'http';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Store active socket io server instance globally so API routes can emit if needed
  (global as any).io = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join_session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined room session:${sessionId}`);
    });

    socket.on('leave_session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
      console.log(`[Socket.IO] Socket ${socket.id} left room session:${sessionId}`);
    });

    socket.on('location_update', (data: { sessionId: string; point: any }) => {
      console.log(`[Socket.IO] Location update for session ${data.sessionId}:`, data.point);
      io.to(`session:${data.sessionId}`).emit('location_broadcast', data.point);
    });

    socket.on('tracking_stopped', (data: { sessionId: string }) => {
      io.to(`session:${data.sessionId}`).emit('tracking_stopped', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  // Let Next.js handle all requests
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
