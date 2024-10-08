import { Button } from "@/components/ui/button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { IconType } from "react-icons/lib";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sidebarItemVariants = cva(
    "flex items-center gap-1.5 justify-start font-normal h-7 px-[18px] text-sm overflow-hidden",
    {
        variants: {
            variant: {
                default: "text-[#F9EDFFCC]",
                active: "text-[#481349] bg-white/90 hover:bg-white/90"
            }
        },
        defaultVariants: {
            variant: "default"
        }
    }
)

type Props = {
    label: string;
    id: string;
    icon: LucideIcon | IconType;
    variant?: VariantProps<typeof sidebarItemVariants>["variant"]
}
export const SidebarItem = ({
    label,
    id,
    icon: Icon,
    variant
}: Props) => {
    const workspaceId = useWorkspaceId();

    return ( 
        <Button
            className={cn(sidebarItemVariants({ variant }))}
            variant="transparent"
            size="sm"
            asChild
        >
            <Link href={`/workspace/${workspaceId}/channel/${id}`} >
                <Icon className="size-3.5 mr-1 shrink-0" />
                <span className="text-sm truncate" >{label}</span>
            </Link>
        </Button>
    );
}