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
  arrowColor?: string;
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, align = "center", sideOffset = 12, showArrow = false, arrowClassName, arrowColor, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={showArrow ? 8 : sideOffset}
      collisionPadding={16}
      className={cn(
        "z-50 w-72 rounded-xl bg-popover p-4 text-popover-foreground outline-none border [filter:drop-shadow(0_10px_25px_rgb(0_0_0/0.15))_drop-shadow(0_4px_6px_rgb(0_0_0/0.1))] dark:[filter:drop-shadow(0_10px_25px_rgb(0_0_0/0.4))_drop-shadow(0_4px_6px_rgb(0_0_0/0.3))] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    >
      {props.children}
      {showArrow && (
        <PopoverPrimitive.Arrow 
          className={cn(arrowClassName)} 
          width={14} 
          height={7}
          style={{ 
            fill: arrowColor || 'hsl(var(--popover))'
          }}
        />
      )}
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverArrow };
