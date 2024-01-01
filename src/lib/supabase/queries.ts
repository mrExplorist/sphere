'use server';

import { and, eq, ilike, notExists } from 'drizzle-orm';
import { files, folders, users, workspaces } from '../../../migrations/schema';
import db from './db';
import { File, Folder, Subscription, User, workspace } from './supabase.types';
import { validate } from 'uuid';
import { collaborators } from './schema';
import { revalidatePath } from 'next/cache';

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Queries for communicating with the database ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Query for creating a new workspace
export const createWorkspace = async (workspace: workspace) => {
  try {
    const response = await db.insert(workspaces).values(workspace);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

// Query for getting user subscription status
export const getUserSubscriptionStatus = async (userId: string) => {
  try {
    const data = await db.query.subscriptions.findFirst({
      where: (s, { eq }) => eq(s.userId, userId),
    });
    if (data) return { data: data as Subscription, error: null };
    else return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: `Error ${error}` };
  }
};

// Query for getting files
export const getFiles = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid) return { data: null, error: 'Error' };
  try {
    const results = (await db.select().from(files).orderBy(files.createdAt).where(eq(files.folderId, folderId))) as
      | File[]
      | [];
    return { data: results, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

// Query for getting folders

export const getFolders = async (workspaceId: string) => {
  const isValid = validate(workspaceId);
  if (!isValid) return { data: null, error: 'Error' };
  try {
    const results: Folder[] | [] = await db
      .select()
      .from(folders)
      .orderBy(folders.createdAt)
      .where(eq(folders.workspaceId, workspaceId));
    return { data: results, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error getting folders from db' };
  }
};

// Query for getting private workspace by user ID
export const getPrivateWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const privateWorkspaces = (await db
    .select({
      id: workspaces.id,
      createdAt: workspaces.createdAt,
      workspaceOwner: workspaces.workspaceOwner,
      title: workspaces.title,
      iconId: workspaces.iconId,
      data: workspaces.data,
      inTrash: workspaces.inTrash,
      logo: workspaces.logo,
      bannerUrl: workspaces.bannerUrl,
    })
    .from(workspaces)
    .where(
      and(
        notExists(db.select().from(collaborators).where(eq(collaborators.workspaceId, workspaces.id))),
        eq(workspaces.workspaceOwner, userId),
      ),
    )) as workspace[];
  return privateWorkspaces;
};

// Query for getting collaborative workspace by user ID

export const getCollaboratingWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const collaboratedWorkspaces = (await db
    .select({
      id: workspaces.id,
      createdAt: workspaces.createdAt,
      workspaceOwner: workspaces.workspaceOwner,
      title: workspaces.title,
      iconId: workspaces.iconId,
      data: workspaces.data,
      inTrash: workspaces.inTrash,
      logo: workspaces.logo,
      bannerUrl: workspaces.bannerUrl,
    })
    .from(users)
    .innerJoin(collaborators, eq(users.id, collaborators.userId))
    .innerJoin(workspaces, eq(collaborators.workspaceId, workspaces.id))
    .where(eq(users.id, userId))) as workspace[];
  return collaboratedWorkspaces;
};

// Query for shared workspaces by user ID
export const getSharedWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const sharedWorkspaces = (await db
    .selectDistinct({
      id: workspaces.id,
      createdAt: workspaces.createdAt,
      workspaceOwner: workspaces.workspaceOwner,
      title: workspaces.title,
      iconId: workspaces.iconId,
      data: workspaces.data,
      inTrash: workspaces.inTrash,
      logo: workspaces.logo,
      bannerUrl: workspaces.bannerUrl,
    })
    .from(workspaces)
    .orderBy(workspaces.createdAt)
    .innerJoin(collaborators, eq(workspaces.id, collaborators.workspaceId))
    .where(eq(workspaces.workspaceOwner, userId))) as workspace[];
  return sharedWorkspaces;
};

// Query for adding collaborators

export const addCollaborators = async (users: User[], workspaceId: string) => {
  const response = users.forEach(async (user: User) => {
    // Checking if user exists
    const userExists = await db.query.collaborators.findFirst({
      where: (u, { eq }) => and(eq(u.userId, user.id), eq(u.workspaceId, workspaceId)),
    });

    if (!userExists) await db.insert(collaborators).values({ workspaceId, userId: user.id });
  });
};

// Query for removing collaborastors

export const removeCollaborators = async (users: User[], workspaceId: string) => {
  const response = users.forEach(async (user: User) => {
    // Checking if user exists
    const userExists = await db.query.collaborators.findFirst({
      where: (u, { eq }) => and(eq(u.userId, user.id), eq(u.workspaceId, workspaceId)),
    });

    if (userExists)
      await db
        .delete(collaborators)
        .where(and(eq(collaborators.userId, user.id), eq(collaborators.workspaceId, workspaceId)));
  });
};

// Query for getUser from search

export const getUsersFromSearch = async (email: string) => {
  if (!email) return [];

  //   Getting the account
  const accounts = db
    .select()
    .from(users)
    .where(ilike(users.email, `${email}%`));

  return accounts;
};

// Create folder
export const createFolder = async (folder: Folder) => {
  try {
    const results = await db.insert(folders).values(folder);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

// Update Folder
export const updateFolder = async (folder: Partial<Folder>, folderId: string) => {
  try {
    await db.update(folders).set(folder).where(eq(folders.id, folderId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

// update the workspace

export const updateWorkspace = async (workspace: Partial<workspace>, workspaceId: string) => {
  if (!workspaceId) return;

  try {
    await db.update(workspaces).set(workspace).where(eq(workspaces.id, workspaceId));

    revalidatePath(`/dashboard/${workspaceId}`);

    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

// Create New File

export const createFile = async (file: File) => {
  try {
    await db.insert(files).values(file);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

// Update file
export const updateFile = async (file: Partial<File>, fileId: string) => {
  try {
    const response = await db.update(files).set(file).where(eq(files.id, fileId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};
