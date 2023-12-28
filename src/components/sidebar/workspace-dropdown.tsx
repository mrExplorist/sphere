// Import necessary dependencies and components
'use client';
import { useAppState } from '@/lib/providers/state-provider';
import { workspace } from '@/lib/supabase/supabase.types';
import React, { useEffect, useState } from 'react';

import SelectedWorkspace from './selected-workspace';
import CustomDialogTrigger from '../global/custom-dialog-trigger';
import WorkspaceCreator from '../global/workspace-creator';

// Define prop types for the WorkspaceDropdown component
interface WorkspaceDropdownProps {
  privateWorkspaces: workspace[] | [];
  sharedWorkspaces: workspace[] | [];
  collaboratingWorkspaces: workspace[] | [];
  defaultValue: workspace | undefined;
}

// WorkspaceDropdown component
const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
  privateWorkspaces,
  collaboratingWorkspaces,
  sharedWorkspaces,
  defaultValue,
}) => {
  // Access application state using the useAppState hook
  const { dispatch, state } = useAppState();

  // Local state to manage selected workspace and dropdown visibility
  const [selectedOption, setSelectedOption] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  // Effect to initialize the state with workspaces if it's empty
  useEffect(() => {
    if (!state.workspaces.length) {
      dispatch({
        type: 'SET_WORKSPACES',
        payload: {
          workspaces: [...privateWorkspaces, ...sharedWorkspaces, ...collaboratingWorkspaces].map((workspace) => ({
            ...workspace,
            folders: [],
          })),
        },
      });
    }
  }, [privateWorkspaces, collaboratingWorkspaces, sharedWorkspaces]);

  // Event handler to update the selected workspace
  const handleSelect = (option: workspace) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  // Effect to select a workspace based on the defaultValue
  useEffect(() => {
    const findSelectedWorkspace = state.workspaces.find((workspace) => workspace.id === defaultValue?.id);
    if (findSelectedWorkspace) setSelectedOption(findSelectedWorkspace);
  }, [state, defaultValue]);

  return (
    <div className="relative inline-block text-left">
      <div>
        {/* Clickable area to toggle dropdown visibility */}
        <span onClick={() => setIsOpen(!isOpen)}>
          {selectedOption ? <SelectedWorkspace workspace={selectedOption} /> : 'Select a workspace'}
        </span>
      </div>

      {/* Dropdown content */}
      {isOpen && (
        <div className="origin-top-right absolute w-full rounded-md shadow-md z-50 h-[190px] bg-black/10 backdrop-blur-lg group border-[1px] border-muted">
          <div className="rounded-md flex flex-col ">
            <div className="!p-2">
              {/* Render private workspaces if available */}
              {!!privateWorkspaces.length && (
                <>
                  <p className="text-muted-foreground">Private</p>
                  <hr></hr>
                  {privateWorkspaces.map((option) => (
                    // Map and render private workspaces
                    <SelectedWorkspace key={option.id} workspace={option} onClick={handleSelect} />
                  ))}
                </>
              )}

              {/* Render shared workspaces if available */}
              {!!sharedWorkspaces.length && (
                <>
                  <p className="text-muted-foreground">Shared</p>
                  <hr />
                  {sharedWorkspaces.map((option) => (
                    // Map and render shared workspaces
                    <SelectedWorkspace key={option.id} workspace={option} onClick={handleSelect} />
                  ))}
                </>
              )}

              {/* Render collaborating workspaces if available */}
              {!!collaboratingWorkspaces.length && (
                <>
                  <p className="text-muted-foreground">Collaborating</p>
                  <hr />
                  {collaboratingWorkspaces.map((option) => (
                    // Map and render collaborating workspaces
                    <SelectedWorkspace key={option.id} workspace={option} onClick={handleSelect} />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDropdown;
