'use client';

import { useAppState } from '@/lib/providers/state-provider';
import { File, Folder, workspace } from '@/lib/supabase/supabase.types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import 'quill/dist/quill.snow.css';
import { Button } from '../ui/button';
import {
  deleteFile,
  deleteFolder,
  getFileDetails,
  getFolderDetails,
  getWorkspaceDetails,
  updateFile,
  updateFolder,
  updateWorkspace,
} from '@/lib/supabase/queries';
import { usePathname, useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import EmojiPicker from '../global/emoji-picker';
import BannerUpload from '../banner-upload/banner-upload';
import { XCircleIcon } from 'lucide-react';

interface QuillEditorProps {
  dirDetails: File | Folder | workspace;
  fileId: string;
  dirType: 'workspace' | 'folder' | 'file';
}

// Toolbar options
var TOOLBAR_OPTIONS = [
  ['bold', 'italic', 'underline', 'strike'], // toggled buttons
  ['blockquote', 'code-block'],

  [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
  [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
  [{ direction: 'rtl' }], // text direction

  [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],

  ['clean'], // remove formatting button
];

const QuillEditor: React.FC<QuillEditorProps> = ({ dirDetails, fileId, dirType }) => {
  const { state, workspaceId, folderId, dispatch } = useAppState();

  //  For mounting quill editor
  const [quill, setQuill] = useState<any>();

  const router = useRouter();

  const pathname = usePathname();

  const [collaborators, setCollaborators] = useState<{ id: string; email: string; avatarUrl: string }[]>([
    {
      id: '1',
      email: 'lksharma@gmail.com',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState(false);
  const supabase = createClientComponentClient();

  // we need to get directory details and need to sync it with server and client side data

  const details = useMemo(() => {
    let selectedDir;

    if (dirType === 'file') {
      selectedDir = state.workspaces
        .find((w) => w.id === workspaceId)
        ?.folders.find((f) => f.id === folderId)
        ?.files.find((f) => f.id === fileId);
    }
    if (dirType === 'folder') {
      selectedDir = state.workspaces.find((w) => w.id === workspaceId)?.folders.find((f) => f.id === fileId);
    }

    if (dirType === 'workspace') {
      selectedDir = state.workspaces.find((w) => w.id === fileId);
    }

    if (selectedDir) {
      return selectedDir;
    }

    return {
      title: dirDetails.title,
      iconId: dirDetails.iconId,
      createdAt: dirDetails.createdAt,
      data: dirDetails.data,
      inTrash: dirDetails.inTrash,
      bannerUrl: dirDetails.bannerUrl,
    } as workspace | Folder | File;
  }, [state, workspaceId, folderId]);

  //   BreadCrumbs handler for folder and file

  const breadCrumbs = useMemo(() => {
    if (!pathname || !workspaceId || !state.workspaces) return;

    const segments = pathname.split('/').filter((val) => val !== 'dashboard' && val);

    // workspace details
    const workspaceDetails = state.workspaces.find((w) => w.id === workspaceId);

    const workspaceBreadCrumb = workspaceDetails ? `${workspaceDetails.iconId} ${workspaceDetails.title}` : '';
    if (segments.length === 1) {
      return workspaceBreadCrumb;
    }

    const folderSegment = segments[1];
    const folderDetails = workspaceDetails?.folders.find((folder) => folder.id === folderSegment);
    const folderBreadCrumb = folderDetails ? `/ ${folderDetails.iconId} ${folderDetails.title}` : '';

    if (segments.length === 2) {
      return `${workspaceBreadCrumb} ${folderBreadCrumb}`;
    }

    const fileSegment = segments[2];
    const fileDetails = folderDetails?.files.find((file) => file.id === fileSegment);
    const fileBreadCrumb = fileDetails ? `/ ${fileDetails.iconId} ${fileDetails.title}` : '';

    return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`;
  }, [state, pathname, workspaceId]);

  //   wrapper Ref

  const wrapperRef = useCallback(async (wrapper: any) => {
    if (typeof window !== 'undefined') {
      if (wrapper === null) return;
      wrapper.innerHTML = '';
      const editor = document.createElement('div');
      wrapper.append(editor);
      const Quill = (await import('quill')).default;

      // TODO: CURSOR
      const q = new Quill(editor, {
        theme: 'snow',
        modules: {
          toolbar: TOOLBAR_OPTIONS,
        },
      });
      setQuill(q);
    }
  }, []);

  //   Restore file handler
  const restoreFileHandler = async () => {
    if (dirType === 'file') {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: 'UPDATE_FILE',
        payload: {
          fileId,
          folderId,
          workspaceId,
          file: {
            inTrash: '',
          },
        },
      });

      await updateFile(
        {
          inTrash: '',
        },
        fileId,
      );
    }
    if (dirType === 'folder') {
      if (!workspaceId) return;
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          folderId: fileId,
          workspaceId,
          folder: {
            inTrash: '',
          },
        },
      });
      await updateFolder(
        {
          inTrash: '',
        },
        fileId,
      );
    }
  };

  //   Delete file handler

  const deleteFileHandler = async () => {
    if (dirType === 'file') {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: 'DELETE_FILE',
        payload: { fileId, folderId, workspaceId },
      });
      await deleteFile(fileId);
      router.replace(`/dashboard/${workspaceId}`);
    }
    if (dirType === 'folder') {
      if (!workspaceId) return;
      dispatch({
        type: 'DELETE_FOLDER',
        payload: { folderId: fileId, workspaceId },
      });
      await deleteFolder(fileId);
      router.replace(`/dashboard/${workspaceId}`);
    }
  };

  //   icon on change handler
  const iconOnChange = async (icon: string) => {
    if (!fileId) return;
    if (dirType === 'workspace') {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        payload: { workspace: { iconId: icon }, workspaceId: fileId },
      });
      await updateWorkspace({ iconId: icon }, fileId);
    }
    if (dirType === 'folder') {
      if (!workspaceId) return;
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          folder: { iconId: icon },
          workspaceId,
          folderId: fileId,
        },
      });
      await updateFolder({ iconId: icon }, fileId);
    }
    if (dirType === 'file') {
      if (!workspaceId || !folderId) return;

      dispatch({
        type: 'UPDATE_FILE',
        payload: { file: { iconId: icon }, workspaceId, folderId, fileId },
      });
      await updateFile({ iconId: icon }, fileId);
    }
  };

  //   Delete banner handler

  const deleteBanner = async () => {
    if (!fileId) return;
    setDeletingBanner(true);

    if (dirType === 'workspace') {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        payload: { workspace: { bannerUrl: '' }, workspaceId: fileId },
      });
      await supabase.storage.from('file-banners').remove([`banner-${fileId}`]);
      await updateWorkspace({ bannerUrl: '' }, fileId);
    }
    if (dirType === 'folder') {
      if (!workspaceId) return;
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          folder: { bannerUrl: '' },
          workspaceId,
          folderId: fileId,
        },
      });
      await supabase.storage.from('file-banners').remove([`banner-${fileId}`]);
      await updateFolder({ bannerUrl: '' }, fileId);
    }

    if (dirType === 'file') {
      if (!workspaceId || !folderId) return;

      dispatch({
        type: 'UPDATE_FILE',
        payload: { file: { bannerUrl: '' }, workspaceId, folderId, fileId },
      });

      await supabase.storage.from('file-banners').remove([`banner-${fileId}`]);
      await updateFile({ bannerUrl: '' }, fileId);
    }
    setDeletingBanner(false);
  };

  //  explain why i am using this below useEffect hook

  //  when user changes the workspace or folder or file then we need to fetch the data from the server and update the client side data

  useEffect(() => {
    if (!fileId) return;
    let selectedDir;

    // Define a function to fetch information
    const fetchInformation = async () => {
      // Fetching details based on dirType
      if (dirType === 'file') {
        const { data: selectedDir, error } = await getFileDetails(fileId);

        // Handle error or missing data
        if (error || !selectedDir) {
          return router.replace('/dashboard');
        }

        if (!selectedDir[0]) {
          if (!workspaceId) return;
          return router.replace(`/dashboard/${workspaceId}`);
        }
        if (!workspaceId || quill === null) return;
        if (!selectedDir[0].data) return;

        // Set Quill editor contents and update application state
        quill.setContents(JSON.parse(selectedDir[0].data || ''));
        // Update application state with new data from server response
        dispatch({
          type: 'UPDATE_FILE',
          payload: {
            file: { data: selectedDir[0].data },
            fileId,
            folderId: selectedDir[0].folderId,
            workspaceId,
          },
        });
      }
      if (dirType === 'folder') {
        const { data: selectedDir, error } = await getFolderDetails(fileId);
        if (error || !selectedDir) {
          return router.replace('/dashboard');
        }

        if (!selectedDir[0]) {
          router.replace(`/dashboard/${workspaceId}`);
        }
        if (quill === null) return;
        if (!selectedDir[0].data) return;
        quill.setContents(JSON.parse(selectedDir[0].data || ''));
        // Update application state with new data from server response
        dispatch({
          type: 'UPDATE_FOLDER',
          payload: {
            folderId: fileId,
            folder: { data: selectedDir[0].data },
            workspaceId: selectedDir[0].workspaceId,
          },
        });
      }
      if (dirType === 'workspace') {
        const { data: selectedDir, error } = await getWorkspaceDetails(fileId);
        if (error || !selectedDir) {
          return router.replace('/dashboard');
        }
        if (!selectedDir[0] || quill === null) return;
        if (!selectedDir[0].data) return;
        // Set Quill editor contents and update application state
        quill.setContents(JSON.parse(selectedDir[0].data || ''));
        dispatch({
          type: 'UPDATE_WORKSPACE',
          payload: {
            workspace: { data: selectedDir[0].data },
            workspaceId: fileId,
          },
        });
      }
    };
    fetchInformation();
  }, [fileId, workspaceId, quill, dirType]);

  return (
    <>
      <div className="relative">
        {details.inTrash && (
          <article
            className="py-2
          z-40
          bg-[#EB5757]
          flex
          md:flex-row
          flex-col
          justify-center
          items-center
          gap-4
          flex-wrap"
          >
            <div
              className="flex
            flex-col
            md:flex-row
            gap-2
            justify-center
            items-center"
            >
              <span className="text-white">This {dirType} is in the trash.</span>
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent
                border-white
                text-white
                hover:bg-white
                hover:text-[#EB5757]
                "
                onClick={restoreFileHandler}
              >
                Restore
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="bg-transparent
                border-white
                text-white
                hover:bg-white
                hover:text-[#EB5757]
                "
                onClick={deleteFileHandler}
              >
                Delete
              </Button>
            </div>

            <span className="text-sm text-white">{details.inTrash}</span>
          </article>
        )}

        <div
          className="flex
        flex-col-reverse
        sm:flex-row
        sm:justify-between
        justify-center
        sm:items-center
        sm:p-2
        p-8"
        >
          <div>{breadCrumbs}</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-10">
              {collaborators?.map((collaborator) => (
                <TooltipProvider key={collaborator.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar
                        className="
                    -ml-3
                    bg-background
                    border-2
                    flex
                    items-center
                    justify-center
                    border-white
                    h-8
                    w-8
                    rounded-full
                    "
                      >
                        <AvatarImage
                          src={collaborator.avatarUrl ? collaborator.avatarUrl : ''}
                          className="rounded-full"
                        />
                        <AvatarFallback>{collaborator.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{collaborator.email}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            {saving ? (
              <Badge
                variant="secondary"
                className="bg-orange-600 top-4
                text-white
                right-4
                z-50
                "
              >
                Saving...
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-emerald-600
                top-4
              text-white
              right-4
              z-50
              "
              >
                Saved
              </Badge>
            )}
          </div>
        </div>
      </div>

      {details.bannerUrl && (
        <div className="relative w-full h-[200px]">
          <Image
            src={supabase.storage.from('file-banners').getPublicUrl(details.bannerUrl).data.publicUrl}
            fill
            className="w-full md:h-48
            h-20
            object-cover"
            alt="Banner Image"
          />
        </div>
      )}
      <div className="flex justify-center items-center flex-col mt-2 relative ">
        <div
          className="w-full
        self-center
        max-w-[1200px]
        flex
        flex-col
         px-7
         lg:my-8"
        >
          <div className="text-[80px]">
            <EmojiPicker getValue={iconOnChange}>
              <div
                className="w-[100px]
                cursor-pointer
                transition-colors
                h-[100px]
                flex
                items-center
                justify-center
                hover:bg-muted
                rounded-xl"
              >
                {details.iconId}
              </div>
            </EmojiPicker>
          </div>
          <div className="flex">
            <BannerUpload
              details={details}
              id={fileId}
              dirType={dirType}
              className="mt-2
              text-sm
              text-muted-foreground
              p-2
              hover:text-card-foreground
              transition-all
              rounded-md"
            >
              {details.bannerUrl ? 'Update Banner' : 'Add Banner'}
            </BannerUpload>

            {details.bannerUrl && (
              <Button
                disabled={deletingBanner}
                onClick={deleteBanner}
                variant="ghost"
                className="gap-2 hover:bg-background
                flex
                item-center
                justify-center
                mt-2
                text-sm
                text-muted-foreground
                w-36
                p-2
                rounded-md"
              >
                <XCircleIcon size={16} />
                <span className="whitespace-nowrap font-normal">Remove Banner</span>
              </Button>
            )}
          </div>
          <span
            className="
            text-muted-foreground
            text-3xl
            font-bold
            h-9
          "
          >
            {details.title}
          </span>
          <span className="text-muted-foreground text-sm">{dirType.toUpperCase()}</span>
        </div>
        <div id="container" className="max-w-[800px] align-right" ref={wrapperRef}></div>
      </div>
    </>
  );
};

export default QuillEditor;
