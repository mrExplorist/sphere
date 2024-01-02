'use client';

import { useAppState } from '@/lib/providers/state-provider';
import { File, Folder, workspace } from '@/lib/supabase/supabase.types';
import React, { useCallback, useMemo, useState } from 'react';
import 'quill/dist/quill.snow.css';
import { Button } from '../ui/button';

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

  //  TODOS: we need to get directory details and need to sync it with server and client side data
  // 1.  get directory details
  // 2.  get file details
  // 3.  get file content
  // 4.  sync file content with quill editor
  // 5.  sync quill editor with file content
  // 6.  sync file content with server
  // 7.  sync file content with client
  // 8.  sync directory details with server and client

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

  return (
    <>
      <div className="flex justify-center items-center flex-col mt-2 relative ">
        <div id="container" className="max-w-[800px] align-right" ref={wrapperRef}></div>
      </div>
    </>
  );
};

export default QuillEditor;
