
import { differenceInMinutes, format, isToday, isYesterday } from 'date-fns';
import { GetMessagesReturnType } from "@/features/messages/api/use-get-messages";
import { Message } from '@/components/mesage';
import { ChannelHero } from './channel-hero';
import { useState } from 'react';
import { Id } from '../../convex/_generated/dataModel';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { useCurrentMember } from '@/features/members/api/use-current-member';
import { Loader } from 'lucide-react';
import { ConversationHero } from './conversation-hero';

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

type Props = {
    memberName?: string;
    memberImage?: string;
    channelName?: string;
    channelCreationTime?: number;
    variant?: "channel" | "thread" | "conversation";
    data: GetMessagesReturnType | undefined;
    loadMore: () => void;
    isLoadingMore: boolean;
    canLoadMore: boolean
}
export const MessageList = ({
    canLoadMore,
    data,
    isLoadingMore,
    loadMore,
    memberImage,
    memberName,
    channelName,
    channelCreationTime,
    variant = "channel",
}: Props) => {
    const [editingId, setEditingId] = useState<Id<"messages"> | null>(null)

    const workspaceId = useWorkspaceId();

    const { data: currentMember } = useCurrentMember({ workspaceId })

    const groupedMessages = data?.reduce(
        (groups, message) => {
            const date = new Date(message._creationTime);
            const dataKey = format(date, "yyyy-MM-dd");
            if (!groups[dataKey]) {
                groups[dataKey] = [];
            }
            groups[dataKey].unshift(message);
            return groups;
        },
        {} as Record<string, typeof data>
    )

    return ( 
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
                                hideThreadButton={variant === "thread"}
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
            {variant === "channel" && channelName && channelCreationTime && (
                <ChannelHero
                    name={channelName}
                    createionTime={channelCreationTime}
                />
            )}
            {variant === "conversation" && (
                <ConversationHero
                    name={memberName}
                    image={memberImage}
                />
            )}
        </div>
    );
}