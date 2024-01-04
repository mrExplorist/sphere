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

// io handler
const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const path = '/api/socket/io';
    console.log(`* First use, starting socket.io on path "${path}"`);

    const httpServer: NetServer = res.socket.server as any;

    // create socket.io server
    const io = new ServerIO(httpServer, {
      path,
      addTrailingSlash: false,
    });

    // handle socket.io events
    io.on('connection', (s) => {
      console.log('a user connected');
      s.on('create-room', (fileId) => {
        console.log('🔵 create-room ');
        s.join(fileId);
      });
      s.on('send-changes', (deltas, fileId) => {
        console.log('📤 send-changes');
        s.to(fileId).emit('receive-changes', deltas, fileId);
      });
      s.on('send-cursor-move', (range, fileId, cursorId) => {
        console.log('📤 send-cursor-move');
        s.to(fileId).emit('receive-cursor-move', range, fileId, cursorId);
      });
    });
    res.socket.server.io = io;
  }
  res.end();
};

export default ioHandler;
