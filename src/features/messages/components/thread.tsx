import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel";
import { AlertTriangle, Loader, XIcon } from "lucide-react";
import { useGetMessage } from "../api/use-get-message";
import { Message } from "@/components/mesage";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useRef, useState } from "react";
import Quill from "quill";
import { useGenerateUploadUrl } from "@/features/upload/api/use-create-upload-url";
import { useCreateMessage } from "../api/use-create-message";
import { useChannelId } from "@/hooks/use-channel-id";
import { toast } from "sonner";
import { useGetMessages } from "../api/use-get-messages";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false })

const TIME_THRESHOLD = 5 ;

const formatDateLabel = (dateStr: string = "2024-10-03") => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    // const date = new Date(dateStr);
    
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";

    const currentYear = new Date().getFullYear();

    if (date.getFullYear() !== currentYear) {
        return format(date, "EEEE, MMMM d, yyyy");
    }

    return format(date, "EEEE, MMMM d")
}

type CreateMessageValues = {
    channelId: Id<"channels">,
    workspaceId: Id<"workspaces">,
    parentMessageId: Id<"messages">,
    body: string,
    image?: Id<"_storage">,
}

type Props = {
    messageId: Id<"messages">;
    onClose: () => void
}
export const Thread = ({
    messageId,
    onClose
}: Props) => {
    const channelId = useChannelId()
    const workspaceId = useWorkspaceId();
    
    const [editorKey, setEditorKey] = useState(0);
    const [isPending, setIsPendeing] = useState(false);
    const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);

    const editorRef = useRef<Quill | null>(null);

    const { mutate: generateUploadUrl } = useGenerateUploadUrl();
    const { mutate: createMessage } = useCreateMessage();

    const { data: currentMember } = useCurrentMember({ workspaceId })
    const { data: message, isLoading: messageIsLoading } = useGetMessage({ id: messageId });
    const { results, status, loadMore} = useGetMessages({
        channelId,
        parentMessageId: messageId,
        conversationId: message?.conversationId
    })

    const canLoadMore = status === "CanLoadMore";
    const isLoadingMore = status === "LoadingMore";

    const handleSubmit = async ({
        body,
        image,
    }: {
        body: string;
        image: File | null;
    }) => {
        try {
            setIsPendeing(true);
            editorRef.current?.enable(false);

            const values: CreateMessageValues = {
                channelId,
                workspaceId,
                parentMessageId: messageId,
                body,
                image: undefined,
            }

            if (image) {
                const url = await generateUploadUrl({}, { throwError: true });

                if (!url) {
                    throw new Error("Failed to generate upload URL");
                }

                const result = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": image.type },
                    body: image,
                });

                if (!result.status) {
                    throw new Error("Failed to upload image");
                }

                const { storageId } = await result.json();

                values.image = storageId;
            }

            createMessage(values, { throwError: true });


            setEditorKey((prevKey) => prevKey + 1);
        } catch(error) {
            toast.error("Failed to send message");
        } finally {
            setIsPendeing(false);
            editorRef.current?.enable(true);
        }
    };

    const groupedMessages = results?.reduce(
        (groups, message) => {
            const date = new Date(message._creationTime);
            const dataKey = format(date, "yyyy-MM-dd");
            if (!groups[dataKey]) {
                groups[dataKey] = [];
            }
            groups[dataKey].unshift(message);
            return groups;
        },
        {} as Record<string, typeof results>
    )

    if (messageIsLoading || status === "LoadingFirstPage") {
        return (
            <div className="h-full flex flex-col">
                <div className="h-[49px] flex justify-between items-center p-4 border-b">
                    <p className="text-lg font-bold">Thread</p>
                    <Button onClick={onClose} size="iconSm" variant="ghost">
                        <XIcon className="size-5 stroke-[1.5]" />
                    </Button>
                </div>
                <div className="flex h-full items-center justify-center">
                    <Loader className="size-5 animate-spin text-muted-foreground"/>
                </div>
            </div>
        )
    }

    if (!message) {
        return ( 
            <div className="h-full flex flex-col">
                <div className="h-[49px] flex justify-between items-center p-4 border-b">
                    <p className="text-lg font-bold">Thread</p>
                    <Button onClick={onClose} size="iconSm" variant="ghost">
                        <XIcon className="size-5 stroke-[1.5]" />
                    </Button>
                </div>
                <div className="flex flex-col gap-y-2 h-full items-center justify-center">
                    <AlertTriangle className="size-5 text-muted-foreground"/>
                    <p className="text-sm text-muted-foreground">
                        No message found
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col">
            <div className="h-[49px] flex justify-between items-center p-4 border-b">
                <p className="text-lg font-bold">Thread</p>
                <Button onClick={onClose} size="iconSm" variant="ghost">
                    <XIcon className="size-5 stroke-[1.5]" />
                </Button>
            </div>
            <div className="relative flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar">
                {Object.entries(groupedMessages || {}).map(([dateKey, messages], i) => (
                    <div key={dateKey}>
                        <div className='text-center my-2 sticky top-0.5 z-[1]'>
                            {/* <hr className='absolute top-1/2 left-0 right-0 border-t border-gray-300 ' /> */}
                            <span className='relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm'>
                                {formatDateLabel(dateKey)}
                            </span>
                        </div>
                        {messages.map((message, index) => {
                            const prevMessage = messages[index - 1];
                            const isCompact = 
                                prevMessage && 
                                prevMessage?.user._id === message.user?._id &&
                                differenceInMinutes(
                                    new Date(message._creationTime),
                                    new Date(prevMessage._creationTime)
                                ) < TIME_THRESHOLD;

                            return(
                                <Message
                                    key={message._id}
                                    id={message._id}
                                    memberId={message.memberId}
                                    authorImage={message.user.image}
                                    authorName={message.user.name}
                                    isAuthor={message.memberId === currentMember?._id}
                                    reactions={message.reactions}
                                    body={message.body}
                                    image={message.image}
                                    updatedAt={message.updatedAt}
                                    isEditing={editingId === message._id}
                                    setEditingId={setEditingId}
                                    isCompact={isCompact}
                                    hideThreadButton
                                    createdAt={message._creationTime}
                                    threadCount={message.threadCount}
                                    threadImage={message.threadImage}
                                    threadName={message.threadName}
                                    threadTimestamp={message.threadTimestamp}
                                />
                            )
                        })}
                    </div>
                ))}
                <div
                    className='h-1'
                    ref={(el) => {
                        if (el) {
                            const observer = new IntersectionObserver(
                                ([entry]) => {
                                    if (entry.isIntersecting && canLoadMore) {
                                        loadMore();
                                    }
                                },
                                { threshold: 1.0 }
                            );

                            observer.observe(el);
                            return () => observer.unobserve(el);
                        }
                    }}
                />
                {isLoadingMore && (
                    <div className='text-center my-2 sticky top-0.5 z-[1]'>
                        {/* <hr className='absolute top-1/2 left-0 right-0 border-t border-gray-300 ' /> */}
                        <span className='relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm'>
                            <Loader className='size-4 animate-spin'/>
                        </span>
                    </div>
                )}
                <Message
                    hideThreadButton
                    memberId={message.memberId}
                    authorImage={message.user.image}
                    authorName={message.user.name}
                    isAuthor={message.memberId === currentMember?._id}
                    body={message.body}
                    image={message.image}
                    createdAt={message._creationTime}
                    updatedAt={message.updatedAt}
                    id={message._id}
                    reactions={message.reactions}
                    isEditing={editingId === message._id}
                    setEditingId={setEditingId}
                />
            </div>
            <div className="px-4">
                <Editor
                    key={editorKey}
                    onSubmit={handleSubmit}
                    innerRef={editorRef}
                    disabled={isPending}
                    placeholder="Replay..."
                />
            </div>
        </div>
    )

}