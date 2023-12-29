'use client';

import { useAppState } from '@/lib/providers/state-provider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { FC, useMemo, useState } from 'react';
import { AccordionItem } from '../ui/accordion';
import clsx from 'clsx';

interface DropDownProps {
  title: string;
  id: string;
  listType: 'folder' | 'file';
  iconId: string;
  children?: React.ReactNode;
  disabled?: boolean;
  customIcon?: React.ReactNode;
}

const DropDown: FC<DropDownProps> = ({ title, id, listType, iconId, children, disabled, customIcon, ...props }) => {
  //   TODO: Folder title synced with server data and local

  // supabase client for queries and mutations to the database
  const supabase = createClientComponentClient();

  const { state, dispatch, workspaceId } = useAppState();

  //   To keep track of whether the user is editing the folder title or not
  const [isEditing, setIsEditing] = useState(false);

  const router = useRouter();

  //   FILETITLE

  // Function for navigating the user to a different page

  //   Add a file

  //   Double click handler to edit the folder

  //   various types and styles

  const isFolder = listType === 'folder';
  const groupIdentifies = clsx('dark:text-white whitespace-nowrap flex justify-between items-center w-full relative', {
    'group/folder': isFolder,
    'group/file': !isFolder,
  });

  const listStyles = useMemo(
    () =>
      clsx('relative', {
        'border-none text-md': isFolder,
        'border-none ml-6 text-[16px] py-1': !isFolder,
      }),
    [isFolder],
  );

  //   Blur

  //   Onchanges like emoji change

  //   Move to trash

  return <AccordionItem value={id} className={listStyles}></AccordionItem>;
};

export default DropDown;
