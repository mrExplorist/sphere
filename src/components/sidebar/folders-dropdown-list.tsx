'use client';

import { useAppState } from '@/lib/providers/state-provider';
import { Folder } from '@/lib/supabase/supabase.types';
import { FC, useEffect, useState } from 'react';
import TooltipComponent from '../global/tooltip-component';
import { PlusIcon } from 'lucide-react';

import { v4 } from 'uuid';
import { createFolder } from '@/lib/supabase/queries';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { useToast } from '../ui/use-toast';

interface FoldersDropDownListProps {
  workspaceFolders: Folder[];
  workspaceId: string;
}

const FoldersDropDownList: FC<FoldersDropDownListProps> = ({ workspaceFolders, workspaceId }) => {
  // TODO:Local state folders

  //  TODO: Real time updates
  const { state, dispatch } = useAppState();
  const [folders, setFolders] = useState(workspaceFolders);

  const { subscription } = useSupabaseUser();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);

  // Update the state with the latest information about folders. It ensures that the files property of each folder is synchronized with the global state, preventing data inconsistencies and ensuring that the local state accurately reflects the state of the application.

  useEffect(() => {
    if (workspaceFolders.length > 0) {
      dispatch({
        type: 'SET_FOLDERS',
        payload: {
          workspaceId,
          folders: workspaceFolders.map((folder) => ({
            ...folder,
            files:
              state.workspaces
                .find((workspace) => workspace.id === workspaceId)
                ?.folders.find((f) => f.id === folder.id)?.files || [],
          })),
        },
      });
    }
  }, [workspaceFolders, workspaceId]);

  // Update local 'folders' state based on the latest 'workspaces' data in response to changes in the global 'state' object.

  useEffect(() => {
    setFolders(state.workspaces.find((workspace) => workspace.id === workspaceId)?.folders || []);
  }, [state]);

  // TODO: Add Folder function

  return (
    <div
      className="flex
  sticky
  z-20
  top-0
  bg-background
  w-full
  h-10
  group/title
  justify-between
  items-center
  pr-4
  text-Neutrals/neutrals-8
"
    >
      <span
        className="text-Neutrals-8
        font-bold
        text-xs"
      >
        FOLDERS
      </span>
      <TooltipComponent message="Create Folder">
        <PlusIcon
          onClick={() => {}}
          size={16}
          className="group-hover/title:inline-block
            hidden
            cursor-pointer
            hover:dark:text-white
          "
        />
      </TooltipComponent>
    </div>
  );
};

export default FoldersDropDownList;
