import dynamic from "next/dynamic";
import { format, isToday, isYesterday } from "date-fns";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { Hint } from "./hint";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Thumbnail } from "./thumbnail";
import { Toolbar } from "./toolbar";
import { useUpdateMessage } from "@/features/messages/api/use-update-message";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRemoveMessage } from "@/features/messages/api/use-remove-message";
import { useConfirm } from "@/hooks/use-confirm";
import { useToggleReaction } from "@/features/reactions/api/use-toggle-reaction";
import { Reactions } from "./reactions";
import { usePanel } from "@/hooks/use-panel";
import { ThreadBar } from "./thread-bar";

const Renderer = dynamic(() => import("@/components/renderer"), { ssr: false })
const Editor = dynamic(() => import("@/components/editor"), { ssr: false })

const formatFullTime = (date: Date) => {
    return `${isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMM d, yy")} at ${format(date, "h:mm:ss a")}`
}

type Props = {
    id: Id<"messages">;
    memberId: Id<"members">;
    authorImage?: string;
    authorName?: string;
    isAuthor: boolean;
    reactions: Array<
        Omit<Doc<"reactions">, "memberId"> & {
            count: number;
            memberIds: Id<"members">[];
        }
    >;
    body: Doc<"messages">["body"];
    image: string | null | undefined;
    createdAt: Doc<"messages">["_creationTime"];
    updatedAt: Doc<"messages">["updatedAt"];
    isEditing: boolean;
    isCompact?: boolean;
    setEditingId: (id: Id<"messages"> | null) => void;
    hideThreadButton?: boolean;
    threadCount?: number;
    threadImage?: string;
    threadName?: string;
    threadTimestamp?: number;
}
export const Message = ({
    body,
    id,
    memberId,
    authorImage,
    authorName = "Member",
    isAuthor,
    reactions,
    image,
    createdAt,
    updatedAt,
    isEditing,
    isCompact,
    setEditingId,
    hideThreadButton,
    threadCount,
    threadImage,
    threadName,
    threadTimestamp,
}: Props) => {
    const {  parentMessageId, onOpenMessage, onClose, onOpenProfile } = usePanel();

    const [ConfirmDialog, confirm] = useConfirm({
        title: "Delete message",
        message: "Are you sure you want to delete this message?",
    })

    const { mutate: updateMessage, isPending: updateIsPending } = useUpdateMessage();
    const { mutate: removeMessage, isPending: removeIsPending } = useRemoveMessage();
    const { mutate: toggleReaction, isPending: toggleReactionIsPending } = useToggleReaction();

    const isPending = updateIsPending || toggleReactionIsPending;

    const handleReaction = (value: string) => {
        toggleReaction({
            messageId: id,
            value,
        }, {
            onSuccess: () => {
                //
            },
            onError: () => {
                toast.error("Failed to toggle reaction")
            }
        })
    }

    const handleUpdate = ({ body }: { body: string }) => {
        updateMessage({
            id,
            body
        },{
            onSuccess: () => {
                toast.success("Message updated");
                setEditingId(null);
            },
            onError: () => {
                toast.error("Failed to update message");
            }
        })
    }

    const handleRemove = async () => {
        const ok = await confirm();

        if (!ok) return;

        removeMessage({
            id,
        },{
            onSuccess: () => {
                toast.success("Message deleted");
                
                if (parentMessageId === id) {
                    onClose();
                }
            },
            onError: () => {
                toast.error("Failed to delete message");
            }
        })
    }

    const InputEditor = () => {
        return (
            <div className="w-full h-full">
                <Editor
                    onSubmit={handleUpdate}
                    disabled={isPending}
                    defaultValue={JSON.parse(body)}
                    onCancel={() => setEditingId(null)}
                    variant="update"
                />
            </div>
        )
    }


    if (isCompact) {
        return (
            <>
                <ConfirmDialog />
                <div className={cn(
                    "flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/60 group relative",
                    isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433]",
                    removeIsPending && "bg-rose-500 transform transition-all scale-y-0 origin-bottom duration-200"
                )}>
                    <div className="flex items-start gap-2">
                        <Hint label={formatFullTime(new Date(createdAt))}>
                            <button className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 w-[40px] leading-[22px] text-center hover:underline">
                                {format(new Date(createdAt), "hh:mm")}
                            </button>
                        </Hint>
                        {isEditing ? (
                            <InputEditor />
                        ) : (
                            <div className="flex flex-col w-full">
                                <Renderer value={body} />
                                <Thumbnail url={image} />
                                {updatedAt && (
                                    <span className="text-xs text-muted-foreground">(edited)</span>
                                )}
                                <Reactions data={reactions} onChange={handleReaction}/>
                                <ThreadBar 
                                    count={threadCount}
                                    name={threadName}
                                    image={threadImage}
                                    timestamp={threadTimestamp}
                                    onClick={() => onOpenMessage(id)}
                                />
                            </div>
                        )}
                    </div>
                    {!isEditing && (
                        <Toolbar
                            isAuthor={isAuthor}
                            isPending={isPending}
                            handleEdit={() => setEditingId(id)}
                            handleThead={() => onOpenMessage(id)}
                            handleDelete={handleRemove}
                            handleRaction={handleReaction}
                            hideThreadButton={hideThreadButton}
                        />
                    )}
                </div>
            </>
        );
    }

    const avatarFallback = authorName.charAt(0).toUpperCase();

    return (
        <>
            <ConfirmDialog />
            <div className={cn(
                    "flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/60 group relative",
                    isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433]",
                    removeIsPending && "bg-rose-500 transform transition-all scale-y-0 origin-bottom duration-200"
                )}
            >
                <div className="flex items-start gap-2">
                    <button onClick={() => onOpenProfile(memberId)}>
                        <Avatar >
                            <AvatarImage src={authorImage} />
                            <AvatarFallback className="text-base">
                                {avatarFallback}
                            </AvatarFallback>
                        </Avatar>
                    </button>
                    {isEditing ? (
                        <InputEditor />
                    ) : (
                        <div className="flex flex-col w-full overflow-hidden">
                            <div className="text-sm flex items-end gap-x-2 flex-wrap">
                                <button onClick={() => onOpenProfile(memberId)} className="text-start font-bold text-primary hover:underline truncate">
                                    {authorName}
                                </button>
                                {/* <span>&nbsp;&nbsp;</span> */}
                                <Hint label={formatFullTime(new Date(createdAt))}>
                                    <button className="text-xs text-muted-foreground hover:underline">
                                        {format(new Date(createdAt), "h:mm a")}
                                    </button>
                                </Hint>
                            </div>
                            <Renderer value={body} />
                            <Thumbnail url={image} />
                            {updatedAt && (
                                <span className="text-xs text-muted-foreground">(edited)</span>
                            )}
                            <Reactions data={reactions} onChange={handleReaction}/>
                            <ThreadBar 
                                count={threadCount}
                                name={threadName}
                                image={threadImage}
                                timestamp={threadTimestamp}
                                onClick={() => onOpenMessage(id)}
                            />
                        </div>
                    )}
                </div>
                {!isEditing && (
                    <Toolbar
                        isAuthor={isAuthor}
                        isPending={isPending}
                        handleEdit={() => setEditingId(id)}
                        handleThead={() => onOpenMessage(id)}
                        handleDelete={handleRemove}
                        handleRaction={handleReaction}
                        hideThreadButton={hideThreadButton}
                    />
                )}
            </div>
        </>
    );
}