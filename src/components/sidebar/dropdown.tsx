import { FC } from 'react';

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

  //   FILETITLE

  // Function for navigating the user to a different page

  //   Add a file

  //   Double click handler to edit the folder

  //   Blur

  //   Onchanges like emoji change

  //   Move to trash

  return <div>DropDown</div>;
};

export default DropDown;
