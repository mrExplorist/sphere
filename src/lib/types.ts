import { Socket, Server as NetServer } from 'net';
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { z } from 'zod';

export const FormSchema = z.object({
  email: z.string().describe('Email').email({ message: 'Invalid Email' }),
  password: z.string().describe('Password').min(1, 'Password is required'),
});

export const CreateWorkspaceFormSchema = z.object({
  workspaceName: z.string().describe('Workspace Name').min(1, 'Workspace name must be min of 1 character'),
  logo: z.any(),
});

export const UploadBannerFormSchema = z.object({
  banner: z.string().describe('Banner Image'),
});

// NextApiResponseServerIO is a type that represents the response object of a Next.js API route but with an extended structure to include a Socket.IO server (io) associated with the underlying HTTP server. This extended structure allows easier access to the Socket.IO server within the context of handling API requests.
export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};
