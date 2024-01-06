import { NextApiResponseServerIO } from '@/lib/types';
import { NextApiRequest } from 'next';
import { Server as NetServer } from 'http';
import { Server as ServerIO } from 'socket.io';

// config for socket.io server and socket.io-client in client side to connect to this server
export const config = {
  api: {
    bodyParser: false,
  },
};

// 1. create-room
// 2. send-changes
// 3. send-cursor-move

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  // Check if the Socket.IO server has been initialized for the current HTTP server
  if (!res.socket.server.io) {
    // If not initialized, set up the path for Socket.IO
    const path = '/api/socket/io';
    console.log(`* First use, starting socket.io on path "${path}"`);

    // Get the underlying HTTP server from the response object
    const httpServer: NetServer = res.socket.server as any;

    // Create a new Socket.IO server instance, passing the HTTP server and configuration options
    const io = new ServerIO(httpServer, {
      path,
      addTrailingSlash: false,
    });

    // Handle Socket.IO events when a client connects
    // Listening to events
    io.on('connection', (s) => {
      // Event handler for a new client connection
      console.log('a user connected');

      // Event handler for 'create-room' event
      s.on('create-room', (fileId) => {
        console.log('🔵 create-room');
        // Join the specified room (identified by fileId)
        s.join(fileId);
      });

      // Event handler for 'send-changes' event
      s.on('send-changes', (deltas, fileId) => {
        console.log('📤 send-changes');
        // Broadcast received changes to all clients in the same room (fileId)
        s.to(fileId).emit('receive-changes', deltas, fileId);
      });

      // Event handler for 'send-cursor-move' event
      s.on('send-cursor-move', (range, fileId, cursorId) => {
        console.log('📤 send-cursor-move');
        // Broadcast received cursor movement to all clients in the same room (fileId)
        s.to(fileId).emit('receive-cursor-move', range, fileId, cursorId);
      });
    });

    // Store the Socket.IO instance on the HTTP server for future reference
    res.socket.server.io = io;
  }

  // End the response
  res.end();
};

export default ioHandler;
