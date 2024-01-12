// Hook that we will use to listen to real-time changes in our database and update our app state accordingly. We will use this hook in our sidebar component to listen to real-time changes in our database and update our app state accordingly.

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import React, { useEffect } from 'react';
import { appFoldersType, useAppState } from '../providers/state-provider';

import { File, Folder } from '../supabase/supabase.types';
import { useRouter } from 'next/navigation';

const useSupabaseRealtime = () => {
  const supabase = createClientComponentClient();
  const { dispatch, state, workspaceId: selectedWorkspace } = useAppState();
  const router = useRouter();

  //   Listening to real-time changes in file and folder tables in our database and updating our app state accordingly
  useEffect(() => {
    // 1. We create a channel to listen to real-time changes in our database and update our app state accordingly (add, update, delete) files and folders in our app state.
    // 2. We subscribe to the channel and listen to the postgres_changes event.
    // 3. We check the eventType of the payload and update our app state accordingly.
    // 4. We unsubscribe from the channel when the component unmounts.

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          console.log('🟢 RECEIVED REAL TIME EVENT');
          const { folder_id: folderId, workspace_id: workspaceId, id: fileId } = payload.new;
          if (
            // check if file exists in app state before adding it to avoid duplicates in app state when a new file is created in the database and the user is in the same workspace where the file was created. This is because the file will be added to the app state when the user navigates to the workspace.
            !state.workspaces
              .find((workspace) => workspace.id === workspaceId)
              ?.folders.find((folder) => folder.id === folderId)
              ?.files.find((file) => file.id === fileId)
          ) {
            // check if the file was created in the current workspace and navigate to the workspace if it was created in the current workspace. This is because the file will be added to the app state when the user navigates to the workspace.
            const newFile: File = {
              id: payload.new.id,
              workspaceId: payload.new.workspace_id,
              folderId: payload.new.folder_id,
              createdAt: payload.new.created_at,
              title: payload.new.title,
              iconId: payload.new.icon_id,
              data: payload.new.data,
              inTrash: payload.new.in_trash,
              bannerUrl: payload.new.banner_url,
            };
            //  now dispatch the action to add the file to the app state
            dispatch({
              type: 'ADD_FILE',
              payload: { file: newFile, folderId, workspaceId },
            });
          }
        } else if (payload.eventType === 'DELETE') {
          let workspaceId = '';
          let folderId = '';
          const fileExists = state.workspaces.some((workspace) =>
            workspace.folders.some((folder) =>
              folder.files.some((file) => {
                if (file.id === payload.old.id) {
                  workspaceId = workspace.id;
                  folderId = folder.id;
                  return true;
                }
              }),
            ),
          );

          //   if file exists in app state, delete it from app state and navigate to the workspace if the user is in the workspace where the file was deleted. This is because the file will be deleted from the app state when the user navigates to the workspace.
          if (fileExists && workspaceId && folderId) {
            router.replace(`/dashboard/${workspaceId}`);
            dispatch({
              type: 'DELETE_FILE',
              payload: { fileId: payload.old.id, folderId, workspaceId },
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          const { workspace_id: workspaceId, id: folderId } = payload.new;
          state.workspaces.some((workspace) =>
            workspace.folders.some((folder) =>
              folder.files.some((file) => {
                if (file.id === payload.new.id) {
                  dispatch({
                    type: 'UPDATE_FILE',
                    payload: {
                      workspaceId,
                      folderId,
                      fileId: payload.new.id,
                      file: {
                        title: payload.new.title,
                        iconId: payload.new.icon_id,
                        inTrash: payload.new.in_trash,
                      },
                    },
                  });
                  return true;
                }
              }),
            ),
          );
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, state, selectedWorkspace]);

  // TODO:  Listening to real-time changes in Folder table in our database and updating our app state accordingly

  return null;
};

export default useSupabaseRealtime;
