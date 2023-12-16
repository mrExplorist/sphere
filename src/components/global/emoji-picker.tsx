"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface EmojiPickerProps {
  children: React.ReactNode;
  getValue?: (emoji: string) => void;
}
const EmojiPicker: React.FC<EmojiPickerProps> = ({ children, getValue }) => {
  const route = useRouter();
  const Picker = dynamic(() => import("emoji-picker-react"));
  const onClick = (selectedEmoji: any) => {
    if (getValue) getValue(selectedEmoji.emoji);
    route.back();
  };
  return (
    <div className="flex items-center">
      <Popover>
        <PopoverTrigger className="cursor-pointer">
          <div>{children}</div>
        </PopoverTrigger>
        <PopoverContent className="p-0 border-none">
          <Picker onEmojiClick={onClick} />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EmojiPicker;

// Dynamically importing emoji-picker-react using dynamic ----> Load the library only when it's needed, reducing the initial bundle size of your application. This can be beneficial for performance, especially if the emoji picker is not always required on every page or is conditionally rendered based on user interactions. Dynamically importing ensures that the library is fetched and loaded asynchronously when the component is actually used, optimizing the overall application load time.
