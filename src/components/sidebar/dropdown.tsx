'use client';

import { useAppState } from '@/lib/providers/state-provider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { FC, useMemo, useState } from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import clsx from 'clsx';
import EmojiPicker from '../global/emoji-picker';
import { useToast } from '../ui/use-toast';
import { createFile, updateFile, updateFolder } from '@/lib/supabase/queries';
import TooltipComponent from '../global/tooltip-component';
import { PlusIcon, Trash } from 'lucide-react';
import { v4 } from 'uuid';
import { File } from '@/lib/supabase/supabase.types';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';

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
  const { toast } = useToast();
  const { user } = useSupabaseUser();
  const { state, dispatch, workspaceId, folderId } = useAppState();
  const [isEditing, setIsEditing] = useState(false);

  const router = useRouter();

  // ! --------------------> FOLDER TITLE SYNCED WITH SERVER DATA AND LOCAL <----------------- !

  //  & folderTitle using useMemo
  // ~ useMemo optimizes computations by memoizing the result.
  // ~folderTitle is the memoized string representing the title of a folder.
  // ~The function inside useMemo checks if listType is 'folder'.
  // ~It finds the corresponding folder in state.workspaces based on workspaceId and id.
  // ~If the folder is found, it retrieves its title.
  // ~If the retrieved title is the same as the current title or there is no title, it returns the current title.Otherwise, it returns the retrieved title.

  const folderTitle: string | undefined = useMemo(() => {
    if (listType === 'folder') {
      const stateTitle = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === id)?.title;
      if (title === stateTitle || !stateTitle) return title;
      return stateTitle;
    }
  }, [state, listType, workspaceId, id, title]);

  // ! ----------------->  FILETITLE SYNCED WITH SERVER DATA AND LOCAL <----------------- !

  //  & fileTitle is memoized to represent the title of a file.
  // ~The function inside useMemo checks if listType is 'file'.
  // ~Extracts folder and file IDs from id.
  // ~inds the corresponding folder and file in state.workspaces.
  // ~Retrieves the title of the file.
  // ~If the retrieved title is the same as the current title or there is no title, it returns the current title Otherwise, it returns the retrieved title.
  //~ Dependencies include state, listType, workspaceId, id, and title.

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

  //   ! ----------------->  NAVIGATE TO FOLDER OR FILE <----------------- !

  const navigatePage = (accordianId: string, listType: string) => {
    if (listType === 'folder') {
      router.push(`/dashboard/${workspaceId}/${accordianId}`);
    }
    if (listType === 'file') {
      router.push(`/dashboard/${workspaceId}/${folderId}/${accordianId}`);
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
      const { data, error } = await updateFile({ title: fileTitle }, fId[1]);
      if (error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: 'Could not update the title for this file',
        });
      } else
        toast({
          title: 'Success',
          description: 'File title changed.',
        });
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

  //  FolderTitle Change
  const folderTitleChange = (e: any) => {
    if (!workspaceId) return;
    const fid = id.split('folder');
    if (fid.length === 1) {
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          folder: { title: e.target.value },
          folderId: fid[0],
          workspaceId,
        },
      });
    }
  };

  // FileTitle Change
  const fileTitleChange = (e: any) => {
    if (!workspaceId || !folderId) return;
    const fid = id.split('folder');
    if (fid.length === 2 && fid[1]) {
      dispatch({
        type: 'UPDATE_FILE',
        payload: {
          file: { title: e.target.value },
          folderId,
          workspaceId,
          fileId: fid[1],
        },
      });
    }
  };

  //   List styles and hover styles
  const listStyles = useMemo(
    () =>
      clsx('relative', {
        'border-none text-md': isFolder,
        'border-none ml-6 text-[16px] py-1': !isFolder,
      }),
    [isFolder],
  );

  const hoverStyles = useMemo(
    () =>
      clsx('h-full hidden rounded-sm absolute right-0 items-center justify-center', {
        'group-hover/file:block': listType === 'file',
        'group-hover/folder:block': listType === 'folder',
      }),
    [isFolder],
  );

  //   Add New File

  const addNewFile = async () => {
    if (!workspaceId) return;
    const newFile: File = {
      folderId: id,
      data: null,
      createdAt: new Date().toISOString(),
      inTrash: null,
      title: 'Untitled',
      iconId: '📄',
      id: v4(),
      workspaceId,
      bannerUrl: '',
    };
    dispatch({
      type: 'ADD_FILE',
      payload: { file: newFile, folderId: id, workspaceId },
    });
    const { data, error } = await createFile(newFile);
    if (error) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Could not create a file',
      });
    } else {
      toast({
        title: 'Success',
        description: 'File created.',
      });
    }
  };

  //  ! ------------------------------------------>  MOVE TO TRASH <------------------------------------------- !

  // e.stopPropagation(); // to stop the event from bubbling up to the parent element and triggering the accordion to open/close when the user clicks on the folder title. This is because the folder title is inside the accordion trigger. If we don't stop the event from bubbling up, the accordion will open/close when the user clicks on the folder title. We don't want that to happen. We want the accordion to open/close only when the user clicks on the accordion trigger. So, we stop the event from bubbling up to the parent element.
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
          <div className={hoverStyles}>
            <TooltipComponent message="Delete Folder">
              <div></div>
            </TooltipComponent>
            {listType === 'folder' && !isEditing && (
              <TooltipComponent message="Add File">
                <PlusIcon
                  onClick={addNewFile}
                  size={15}
                  className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
                />
              </TooltipComponent>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {state.workspaces
          .find((workspace) => workspace.id === workspaceId)
          ?.folders.find((folder) => folder.id === id)
          ?.files.filter((file) => !file.inTrash)
          .map((file) => {
            const customFileId = `${id}folder${file.id}`;
            return <DropDown key={file.id} title={file.title} listType="file" id={customFileId} iconId={file.iconId} />;
          })}
      </AccordionContent>
    </AccordionItem>
  );
};

export default DropDown;
