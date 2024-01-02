'use client';

import { useAppState } from '@/lib/providers/state-provider';
import { File, Folder, workspace } from '@/lib/supabase/supabase.types';
import React, { useCallback, useMemo, useState } from 'react';
import 'quill/dist/quill.snow.css';
import { Button } from '../ui/button';
import { updateFile, updateFolder } from '@/lib/supabase/queries';

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
                // onClick={deleteFileHandler}
              >
                Delete
              </Button>
            </div>

            <span className="text-sm text-white">{details.inTrash}</span>
          </article>
        )}
      </div>
      <div className="flex justify-center items-center flex-col mt-2 relative ">
        <div id="container" className="max-w-[800px] align-right" ref={wrapperRef}></div>
      </div>
    </>
  );
};

export default QuillEditor;
