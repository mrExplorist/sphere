'use client';

import { FC, useRef, useState } from 'react';
import { useToast } from '../ui/use-toast';
import { useAppState } from '@/lib/providers/state-provider';
import { User, workspace } from '@/lib/supabase/supabase.types';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Briefcase, CreditCard, ExternalLink, Lock, Plus, Share, UserIcon } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { addCollaborators, removeCollaborators, updateWorkspace } from '@/lib/supabase/queries';
import { v4 } from 'uuid';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import CollaboratorSearch from '../global/collaborator-search';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Alert, AlertDescription } from '../ui/alert';
import SphereProfileIcon from '../icons/sphereProfileIcon';
import Link from 'next/link';
import { collaborators } from '../../lib/supabase/schema';

interface SettingsFormProps {}

const SettingsForm: FC<SettingsFormProps> = ({}) => {
  const { toast } = useToast();
  const { user } = useSupabaseUser();
  const router = useRouter();
  const supabase = createClientComponentClient(); // we need to get the url for avatar

  const { state, workspaceId, dispatch } = useAppState();

  const [open, setOpen] = useState();
  const [permissions, setPermissions] = useState('private');
  const [collaborators, setCollaborators] = useState<User[] | []>([]);

  const [openAlertMessage, setOpenAlertMessage] = useState(false);

  const [workspaceDetails, setWorkspaceDetails] = useState<workspace>();

  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState(false);

  //  TODOS: --------------------------->

  //  todo : PAYMENT PORTAL
  //  todo: ADD COLLABORATORS

  const addCollaborator = async (profile: User) => {
    if (!workspaceId) return;

    await addCollaborators(collaborators, workspaceId);
    setCollaborators((prev) => [...prev, profile]);
    router.refresh();
  };

  const removeCollaborator = async (user: User) => {
    if (!workspaceId) return;

    if (collaborators.length === 1) {
      setPermissions('private');
    }

    await removeCollaborators([user], workspaceId);
    setCollaborators(collaborators.filter((c) => c.id !== user.id));

    // to refresh our workspace categories
    router.refresh();
  };

  //   onchange

  const workspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId || e.target.value) return;

    dispatch({
      type: 'UPDATE_WORKSPACE',
      payload: {
        workspace: { title: e.target.value },
        workspaceId: workspaceId,
      },
    });

    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);

    titleTimerRef.current = setTimeout(async () => {
      await updateWorkspace(
        {
          title: e.target.value,
        },
        workspaceId,
      );
    }, 500);
  };

  // onClicks

  // fetch avatar details
  // get workspace details
  // get workspace details
  // get all the collaborators

  // TODO: payment portal redirects --- FOR STRIPE PAYMENTS

  return (
    <div className="flex gap-4 flex-col">
      <p className="flex items-center gap-2 mt-6">
        <Briefcase size={20} />
        Workspace
      </p>
      <Separator />
      <div className="flex flex-col gap-2">
        <Label htmlFor="workspaceName" className="text-sm text-muted-foreground">
          Name
        </Label>
        <Input
          name="workspaceName"
          value={workspaceDetails ? workspaceDetails.title : ''}
          placeholder="Workspace Name"
          onChange={workspaceNameChange}
        />
        <Label htmlFor="workspaceLogo" className="text-sm text-muted-foreground">
          Workspace Logo
        </Label>
        <Input
          name="workspaceLogo"
          type="file"
          accept="image/*"
          placeholder="Workspace Logo"
          //   onChange={onChangeWorkspaceLogo}
          //   todo: subscription check
          disabled={uploadingLogo}
        />

        {/* {subscription?.status !== 'active' && (
          <small className="text-muted-foreground">To customize your workspace, you need to be on a Pro Plan</small>
        )} */}
      </div>

      <>
        <Label htmlFor="permissions">Permissions</Label>
        <Select onValueChange={() => {}} value={permissions}>
          <SelectTrigger className="w-full h-26 -mt-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="private">
                <div
                  className="p-2
                  flex
                  gap-4
                  justify-center
                  items-center
                "
                >
                  <Lock />
                  <article className="text-left flex flex-col">
                    <span>Private</span>
                    <p>Your workspace is private to you. You can choose to share it later.</p>
                  </article>
                </div>
              </SelectItem>
              <SelectItem value="shared">
                <div className="p-2 flex gap-4 justify-center items-center">
                  <Share></Share>
                  <article className="text-left flex flex-col">
                    <span>Shared</span>
                    <span>You can invite collaborators.</span>
                  </article>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {permissions === 'shared' && (
          <div>
            <CollaboratorSearch
              existingCollaborators={collaborators}
              getCollaborator={(user) => {
                addCollaborator(user);
              }}
            >
              <Button type="button" className="text-sm mt-4">
                <Plus />
                Add Collaborators
              </Button>
            </CollaboratorSearch>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">Collaborators {collaborators.length || ''}</span>
              <ScrollArea
                className="
            h-[120px]
            overflow-y-scroll
            w-full
            rounded-md
            border
            border-muted-foreground/20"
              >
                {collaborators.length ? (
                  collaborators.map((c) => (
                    <div
                      className="p-4 flex
                      justify-between
                      items-center
                "
                      key={c.id}
                    >
                      <div className="flex gap-4 items-center">
                        <Avatar>
                          <AvatarImage src="/avatars/7.png" />
                          <AvatarFallback>PJ</AvatarFallback>
                        </Avatar>
                        <div
                          className="text-sm
                          gap-2
                          text-muted-foreground
                          overflow-hidden
                          overflow-ellipsis
                          sm:w-[300px]
                          w-[140px]
                        "
                        >
                          {c.email}
                        </div>
                      </div>
                      <Button variant="secondary" onClick={() => removeCollaborator(c)}>
                        Remove
                      </Button>
                    </div>
                  ))
                ) : (
                  <div
                    className="absolute
                  right-0 left-0
                  top-0
                  bottom-0
                  flex
                  justify-center
                  items-center
                "
                  >
                    <span className="text-muted-foreground text-sm">You have no collaborators</span>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
        <Alert variant={'destructive'}>
          <AlertDescription>
            Warning! deleting you workspace will permanantly delete all data related to this workspace.
          </AlertDescription>
          <Button
            type="submit"
            size={'sm'}
            variant={'destructive'}
            className="mt-4
            text-sm
            bg-destructive/40
            border-2
            border-destructive"
            onClick={async () => {
              if (!workspaceId) return;
              //   await deleteWorkspace(workspaceId);
              toast({ title: 'Successfully deleted your workspae' });
              dispatch({ type: 'DELETE_WORKSPACE', payload: workspaceId });
              router.replace('/dashboard');
            }}
          >
            Delete Workspace
          </Button>
        </Alert>
        <p className="flex items-center gap-2 mt-6">
          <UserIcon size={20} /> Profile
        </p>
        <Separator />
        <div className="flex items-center">
          <Avatar>
            <AvatarImage src={''} />
            <AvatarFallback>
              <SphereProfileIcon />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col ml-6">
            <small className="text-muted-foreground cursor-not-allowed">{user ? user.email : ''}</small>
            <Label htmlFor="profilePicture" className="text-sm text-muted-foreground">
              Profile Picture
            </Label>
            <Input
              name="profilePicture"
              type="file"
              accept="image/*"
              placeholder="Profile Picture"
              // onChange={onChangeProfilePicture}
              disabled={uploadingProfilePic}
            />
          </div>
        </div>
        {/* <LogoutButton>
          <div className="flex items-center">
            <LogOut />
          </div>
        </LogoutButton> */}
        <p className="flex items-center gap-2 mt-6">
          <CreditCard size={20} /> Billing & Plan
        </p>
        <Separator />
        {/* <p className="text-muted-foreground">
          You are currently on a {subscription?.status === 'active' ? 'Pro' : 'Free'} Plan
        </p> */}
        <Link href="/" target="_blank" className="text-muted-foreground flex flex-row items-center gap-2">
          View Plans <ExternalLink size={16} />
        </Link>
      </>
    </div>
  );
};

export default SettingsForm;
