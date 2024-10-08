import { MessageSquareTextIcon, Pencil, Smile, Trash } from "lucide-react";
import { Button } from "./ui/button";
import { Hint } from "./hint";
import { EmojiPopover } from "./emoji-popover";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useMemberId } from "@/hooks/use-member-id";

type Props = {
    isAuthor: boolean;
    isPending: boolean;
    handleEdit: () => void;
    handleThead: () => void;
    handleDelete: () => void;
    handleRaction: (value: string) => void;
    hideThreadButton?: boolean;
}
export const Toolbar = ({
    isAuthor,
    isPending,
    handleDelete,
    handleEdit,
    handleRaction,
    handleThead,
    hideThreadButton,
}: Props) => {
    const memberId = useMemberId();
    const workspaceId = useWorkspaceId();
    const { data: currentMember } = useCurrentMember({ workspaceId });

    const isAdmin = currentMember?.role === "admin";

    return ( 
        <div className="absolute top-0 right-5 z-[2]">
            <div className="group-hover:opacity-100 opacity-0 transition-opacity border bg-white rounded-md shadow-sm">
                <EmojiPopover
                    hint="Add reaction"
                    onEmojiSelect={(emoji) => handleRaction(emoji)}
                >
                    <Button
                        variant="ghost"
                        size="iconSm"
                        disabled={isPending}
                    >
                        <Smile className="size-4"/>
                    </Button>
                </EmojiPopover>
                {!hideThreadButton && (
                    <Hint label="Reaple in thread">
                        <Button
                            variant="ghost"
                            size="iconSm"
                            disabled={isPending}
                            onClick={handleThead}
                        >
                            <MessageSquareTextIcon className="size-4"/>
                        </Button>
                    </Hint>
                )}
                {isAuthor && (
                    <Hint label="Edit message">
                        <Button
                            variant="ghost"
                            size="iconSm"
                            disabled={isPending}
                            onClick={handleEdit}
                        >
                            <Pencil className="size-4"/>
                        </Button>
                    </Hint>
                )}
                {(isAuthor || (isAdmin && !memberId)) && (
                    <Hint label="Delete">
                        <Button
                            variant="ghost"
                            size="iconSm"
                            disabled={isPending}
                            onClick={handleDelete}
                        >
                            <Trash className="size-4"/>
                        </Button>
                    </Hint>
                )}
            </div>
        </div>
    );
}