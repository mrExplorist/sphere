'use client';

import { useAppState } from '@/lib/providers/state-provider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { FC, useMemo, useState } from 'react';
import { AccordionItem, AccordionTrigger } from '../ui/accordion';
import clsx from 'clsx';
import EmojiPicker from '../global/emoji-picker';
import { useToast } from '../ui/use-toast';
import { updateFolder } from '@/lib/supabase/queries';

interface DropDownProps {
  title: string;
  id: string;
  listType: 'folder' | 'file';
  iconId: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

const DropDown: FC<DropDownProps> = ({ title, id, listType, iconId, children, disabled, ...props }) => {
  //   TODO: Folder title synced with server data and local

  // supabase client for queries and mutations to the database
  const supabase = createClientComponentClient();

  const { state, dispatch, workspaceId, folderId } = useAppState();

  const { toast } = useToast();

  //   To keep track of whether the user is editing the folder title or not
  const [isEditing, setIsEditing] = useState(false);

  const router = useRouter();

  //folder Title synced with server data and local
  const folderTitle: string | undefined = useMemo(() => {
    if (listType === 'folder') {
      const stateTitle = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === id)?.title;
      if (title === stateTitle || !stateTitle) return title;
      return stateTitle;
    }
  }, [state, listType, workspaceId, id, title]);

  //   FILETITLE

  const fileTitle: string | undefined = useMemo(() => {
    if (listType === 'file') {
      const fileAndFolderId = id.split('folder');
      const stateTitle = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === fileAndFolderId[0])
        ?.files.find((file) => file.id === fileAndFolderId[1])?.title;
      if (title === stateTitle || !stateTitle) return title;
      return stateTitle;
    }
  }, [state, listType, workspaceId, id, title]);

  // Function for navigating the user to a different page

  const navigatePage = (accordianId: string, listType: string) => {
    if (listType === 'folder') {
      router.push(`/dashboard/${workspaceId}/folder/${accordianId}`);
    }
    if (listType === 'file') {
      router.push(`/dashboard/${workspaceId}/folder/${folderId}/file/${accordianId}`);
    }
  };

  //   Double click handler to edit the folder for editing
  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  //   various types and styles

  const isFolder = listType === 'folder';

  const groupIdentifies = clsx('dark:text-white whitespace-nowrap flex justify-between items-center w-full relative', {
    'group/folder': isFolder,
    'group/file': !isFolder,
  });

  //   The useMemo hook is used here to memoize the calculated listStyles value. Memoization helps in optimizing performance by preventing unnecessary recalculations of the listStyles value when the component re-renders. In this case, the listStyles value is dependent on the isFolder variable, and since useMemo caches the result of the computation and only recalculates it when the dependencies change, it avoids unnecessary computations during renders when isFolder remains unchanged. This can be particularly beneficial when dealing with complex or expensive calculations.

  const listStyles = useMemo(
    () =>
      clsx('relative', {
        'border-none text-md': isFolder,
        'border-none ml-6 text-[16px] py-1': !isFolder,
      }),
    [isFolder],
  );

  //   Blur
  const handleBlur = async () => {
    if (!isEditing) return;
    setIsEditing(false);
    const fId = id.split('folder');
    if (fId?.length === 1) {
      if (!folderTitle) return;
      toast({
        title: 'Success',
        description: 'Folder title changed.',
      });
      await updateFolder({ title }, fId[0]);
    }

    if (fId.length === 2 && fId[1]) {
      if (!fileTitle) return;

      //   TODO: UPDATE THE FILE
    }
  };

  //   Onchanges like emoji change

  const onChangeEmoji = async (selectedEmoji: string) => {
    if (!workspaceId) return;
    if (listType === 'folder') {
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          workspaceId,
          folderId: id,
          folder: { iconId: selectedEmoji },
        },
      });
      const { data, error } = await updateFolder({ iconId: selectedEmoji }, id);
      if (error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: 'Could not update the emoji for this folder',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Update emoji for the folder',
        });
      }
    }
  };

  //   FolderTitle Change

  const folderTitleChange = (e: any) => {
    const fid = id.split('folder');

    if (!workspaceId) return;
    if (fid.length === 1) {
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          folder: { title },
          folderId: fid[0],
          workspaceId,
        },
      });
    }
  };

  // FileTitle Change
  const fileTitleChange = (e: any) => {
    const fid = id.split('folder');
    if (fid.length === 2 && fid[1]) {
      // todo : update file title dispat
    }
  };

  //   Move to trash

  return (
    <AccordionItem
      value={id}
      className={listStyles}
      onClick={(e) => {
        e.stopPropagation();
        navigatePage(id, listType);
      }}
    >
      <AccordionTrigger
        id={listType}
        className="hover:no-underline
        p-2
        dark:text-muted-foreground
        text-sm"
        disabled={listType === 'file'}
      >
        <div className={groupIdentifies}>
          <div
            className="flex
          gap-4
          items-center
          justify-center
          overflow-hidden"
          >
            <div className="relative">
              <EmojiPicker getValue={onChangeEmoji}>{iconId}</EmojiPicker>
            </div>
            <input
              type="text"
              value={listType === 'folder' ? folderTitle : fileTitle}
              className={clsx('outline-none overflow-hidden w-[140px] text-Neutrals/neutrals-7', {
                'bg-muted cursor-text': isEditing,
                'bg-transparent cursor-pointer': !isEditing,
              })}
              readOnly={!isEditing}
              onDoubleClick={handleDoubleClick}
              onBlur={handleBlur}
              onChange={listType === 'folder' ? folderTitleChange : fileTitleChange}
            />
          </div>
        </div>
      </AccordionTrigger>
    </AccordionItem>
  );
};

export default DropDown;

// e.stopPropagation() is used to stop the event from propagating up or down the DOM hierarchy. Without it, the click event would bubble up to parent elements or propagate down to child elements. In this context, it's preventing the click event from reaching higher-level (parent) elements, ensuring that the click is only handled by the current element and its descendants. This can be useful to prevent unintended interactions or conflicts with other click handlers in the DOM.