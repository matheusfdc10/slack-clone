import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel";
import { useGetMember } from "../api/use-get-member";
import { AlertTriangle, ChevronDownIcon, Loader, MailIcon, XIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MdNearbyError } from "react-icons/md";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useUpdateMember } from "../api/use-update-member";
import { useRemoveMember } from "../api/use-remove-member";
import { useCurrentMember } from "../api/use-current-member";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Props = {
    memberId: Id<"members">,
    onClose: () => void;
}
export const Profile = ({
    memberId,
    onClose
}: Props) => {
    const router = useRouter()
    const workspaceId = useWorkspaceId();

    const [UpdateDialog, confirmUpdate] = useConfirm({
        title: "Update role",
        message: "Are you sure your want to chnage this member's role?"
    });
    const [LeaveDialog, confirmLeave] = useConfirm({
        title: "Leave workspace",
        message: "Are you sure your want to leave this workspace?"
    });
    const [RemoveDialog, confirmRemove] = useConfirm({
        title: "Remove member",
        message: "Are you sure your want to remove this member?"
    });

    const { data: currentMember, isLoading: currentMemberIsLoading } = useCurrentMember({ workspaceId })
    const { data: member, isLoading: memberIsLoading } = useGetMember({ id: memberId });

    const { mutate: updateMember, isPending: updateMemberIsPendeing } = useUpdateMember()
    const { mutate: removerMember, isPending: removeMemberIsPendeing } = useRemoveMember()

    const handleRemoveMember = async () => {
        const ok = await confirmRemove();

        if (!ok) return;

        removerMember({
            id: memberId
        }, {
            onSuccess: () => {
                toast.success("Member removed");
                onClose();
            },
            onError: (error) => {
                toast.error("Failed to remove member")
            }
        })
    }

    const onLeave = async () => {
        const ok = await confirmLeave();

        if (!ok) return;

        removerMember({
            id: memberId
        }, {
            onSuccess: () => {
                toast.success("You left the workspace");
                router.replace("/");
                // onClose();
            },
            onError: (error) => {
                toast.error("Failed to leave the workspace")
            }
        })
    }

    const handleUpdateMember = async (role: "admin" | "member") => {
        const ok = await confirmUpdate();

        if (!ok) return;

        updateMember({
            id: memberId,
            role,
        }, {
            onSuccess: () => {
                toast.success("Role changed");
                onClose();
            },
            onError: (error) => {
                toast.error("Failed to change role")
            }
        })
    }

    if (memberIsLoading || currentMemberIsLoading) {
        return (
            <div className="h-full flex flex-col">
                <div className="h-[49px] flex justify-between items-center p-4 border-b">
                    <p className="text-lg font-bold">Profile</p>
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

    if (!member) {
        return ( 
            <div className="h-full flex flex-col">
                <div className="h-[49px] flex justify-between items-center p-4 border-b">
                    <p className="text-lg font-bold">Profile</p>
                    <Button onClick={onClose} size="iconSm" variant="ghost">
                        <XIcon className="size-5 stroke-[1.5]" />
                    </Button>
                </div>
                <div className="flex flex-col gap-y-2 h-full items-center justify-center">
                    <AlertTriangle className="size-5 text-muted-foreground"/>
                    <p className="text-sm text-muted-foreground">
                        Profile not found
                    </p>
                </div>
            </div>
        );
    }

    const avatarFallback = member.user.name?.charAt(0).toUpperCase()

    return (
        <>
            <RemoveDialog />
            <LeaveDialog />
            <UpdateDialog />
            <div className="h-full flex flex-col w-full">
                <div className="h-[49px] flex justify-between items-center p-4 border-b">
                    <p className="text-lg font-bold">Profile</p>
                    <Button onClick={onClose} size="iconSm" variant="ghost">
                        <XIcon className="size-5 stroke-[1.5]" />
                    </Button>
                </div>
                <div className="overflow-y-auto messages-scrollbar">
                    <div className="flex flex-col items-center justify-center p-4">
                        <Avatar className="max-w-[256px] max-h-[256px] size-full">
                            <AvatarImage src={member.user.image}/>
                            <AvatarFallback className="aspect-square text-6xl">
                                {avatarFallback}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex flex-col p-4 @container">
                        <p className="text-xl font-bold text-center">
                            {member.user.name}
                        </p>
                            {currentMember?._id !== memberId && currentMember?.role === "admin" ? (
                                <div className="flex items-center gap-2 mt-4 flex-wrap @[210px]:flex-nowrap">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="outline"
                                                className="w-full capitalize"
                                            >
                                                {member.role} <ChevronDownIcon className="size-4 ml-2"/>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-full">
                                            <DropdownMenuRadioGroup
                                                value={member.role}
                                                onValueChange={(role) => handleUpdateMember(role as "admin" | "member")}
                                            >
                                                <DropdownMenuRadioItem value="admin">
                                                    Admin
                                                </DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="member">
                                                    Member
                                                </DropdownMenuRadioItem>
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button
                                        onClick={handleRemoveMember}
                                        variant="outline"
                                        className="w-full capitalize"
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ) : currentMember?._id === memberId && currentMember.role !== "admin" ? (
                                    <div className="mt-4">
                                        <Button
                                            onClick={onLeave}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            Leave
                                        </Button>
                                    </div>
                                ) : null
                            }
                    </div>
                    <Separator />
                    <div className="flex flex-col p-4">
                        <p className="text-sm font-bold mb-4">Contact informatioin</p>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="size-9 rounded-md bg-muted flex items-center justify-center">
                                <MailIcon className="size-4"/>
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <p className="text-[13px] font-semibold text-muted-foreground">
                                    Email Address
                                </p>
                                <Link
                                    href={`mailto:${member.user.email}`}
                                    className="text-sm hover:underline text-[#1264e3] truncate"
                                >
                                    {member.user.email}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}