import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";  
import { Button } from "@/components/ui/button";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { Info, Search } from "lucide-react";
import { useState } from "react";
import { useGetChannels } from "@/features/channels/api/use-get-channels";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export const Toolbar = () => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    
    const [open, setOpen] = useState(false);
    
    const { data: workspace } = useGetWorkspace({ id: workspaceId});
    const { data: channels } = useGetChannels({ workspaceId });
    const { data: members } = useGetMembers({ workspaceId });

    const onChannelClick = (channelId: string) => {
        setOpen(false);
        router.push(`/workspace/${workspaceId}/channel/${channelId}`)
    }

    const onMemberClick = (memberId: string) => {
        setOpen(false);
        router.push(`/workspace/${workspaceId}/member/${memberId}`)
    }

    return ( 
        <nav className="bg-[#481349] flex items-center justify-between h-10 p-1.5">
            <div className="flex-1" />
            <div className="w-full max-w-[642px] grow-[2] shrink">
                <Button onClick={() => setOpen(true)} size="sm" className="bg-accent/25 hover:bg-accent-25 w-full justify-start h-7 px-2">
                    <Search className="size-4 text-white mr-2" />
                    <span className="text-white text-xs">
                        Search {workspace?.name}
                    </span>
                </Button>

                <CommandDialog open={open} onOpenChange={setOpen}>
                    <CommandInput placeholder="Type a command or search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup heading="Channels">
                            {channels?.map((channel) => (
                                <CommandItem 
                                    key={channel._id}
                                    id={channel._id}
                                    value={channel.name}
                                    onSelect={() => onChannelClick(channel._id)}
                                >
                                    # {channel.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Members">
                            {members?.map((member) => (
                                <CommandItem
                                    key={member._id}
                                    id={member._id}
                                    value={member.user.name} 
                                    onSelect={() => onMemberClick(member._id)}
                                >
                                    <Avatar className="size-6 mr-2">
                                        <AvatarImage src={member.user.image} />
                                        <AvatarFallback className="text-xs">
                                            {member.user.name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {member.user.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </CommandDialog>
            </div>
            <div className="ml-auto flex-1 flex items-center justify-end">
                <Button size="iconSm" variant="transparent">
                    <Info className="size-5 text-white" />
                </Button>
            </div>
        </nav>
    );
}