import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverArrow = PopoverPrimitive.Arrow;

interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  showArrow?: boolean;
  arrowClassName?: string;
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, align = "center", sideOffset = 14, showArrow = false, arrowClassName, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-xl border bg-popover p-4 text-popover-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        showArrow && "relative",
        className,
      )}
      {...props}
    >
      {props.children}
      {showArrow && (
        <div 
          className={cn(
            "absolute w-4 h-4 rotate-45 border-l border-t border-border bg-popover",
            "data-[side=bottom]:-top-2 data-[side=bottom]:left-1/2 data-[side=bottom]:-translate-x-1/2",
            "data-[side=top]:-bottom-2 data-[side=top]:left-1/2 data-[side=top]:-translate-x-1/2 data-[side=top]:rotate-[225deg]",
            "data-[side=left]:-right-2 data-[side=left]:top-1/2 data-[side=left]:-translate-y-1/2 data-[side=left]:rotate-[135deg]",
            "data-[side=right]:-left-2 data-[side=right]:top-1/2 data-[side=right]:-translate-y-1/2 data-[side=right]:-rotate-45",
            arrowClassName
          )} 
          data-side={props["data-side"] || "bottom"}
          style={{
            boxShadow: '-2px -2px 5px rgba(0,0,0,0.03)'
          }}
        />
      )}
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverArrow };
