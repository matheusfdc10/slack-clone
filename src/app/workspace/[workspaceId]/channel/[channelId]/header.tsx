import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRemoveChannel } from "@/features/channels/api/use-remove-channel";
import { useUpdateChannel } from "@/features/channels/api/use-update-channel";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useChannelId } from "@/hooks/use-channel-id";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { toast } from "sonner";

type Props = {
 title: string
}
export const Header = ({
    title
}: Props) => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    const channelId = useChannelId()
    const [ConfirmDialog, confirm] = useConfirm({
        title: "Delete this Channel?",
        message: "Are you sure you want to delete this channel?",
    })
    
    const [value, setValue] = useState(title);
    const [editOpen, setEditOpen] = useState(false);

    const { data: member } = useCurrentMember({ workspaceId })
    const { mutate: updateChannel, isPending: updateIsPending } = useUpdateChannel();
    const { mutate: removeChannel, isPending: removeIsPending } = useRemoveChannel();

    const handleEditOpen = (valeu: boolean) => {
        if (member?.role === "admin") {
            setEditOpen(valeu)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\s+/g, "-").toLowerCase()
        setValue(value)
    }

    const handleDelete = async () => {
        const ok = await confirm()

        if (!ok) return;

        removeChannel({ id: channelId}, {
            onSuccess(data) {
                toast.success("Channel deleted")
                router.replace(`/workspace/${workspaceId}`)
            },
            onError(error) {
                toast.error("Error deleting channel")
            }
        })
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        updateChannel({ id: channelId, name: value}, {
            onSuccess: () => {
                setEditOpen(false)
                toast.success("Channel updated")
            },
            onError: (error) => {
                toast.error("Failed to update channel")
            }
        })
    }

    return (
        <>
            <ConfirmDialog />
            <div className="bg-white border-b h-[49px] flex items-center px-4 overflow-hidden">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            className="text-lg font-semibold px-2 overflow-hidden w-auto"
                            size="sm"
                        >
                            <span className="truncate"># {title}</span>
                            <FaChevronDown className="size-2.5 ml-2"/>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 bg-gray-50 overflow-hidden">
                        <DialogHeader className="p-4 border-b bg-white">
                            <DialogTitle>
                                # {title}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="px-4 pb-4 flex flex-col gap-y-2">
                            <Dialog open={editOpen} onOpenChange={handleEditOpen}>
                                <DialogTrigger asChild>
                                    <div className="px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm  font-semibold">Channel name</p>
                                            {member?.role === "admin" && (
                                                <p className="text-sm text-[#1264a3 hover:underline font-semibold">Edit</p>
                                            )}
                                        </div>
                                        <p className="text-sm"># {title}</p>
                                    </div>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Rename this channel</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <Input
                                            value={value}
                                            onChange={handleChange}
                                            disabled={updateIsPending}
                                            required
                                            autoFocus
                                            minLength={3}
                                            maxLength={80}
                                            placeholder="e.g. plan-budget"
                                        />
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button
                                                    variant="outline"
                                                    disabled={updateIsPending}
                                                    type="button"
                                                >
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                disabled={updateIsPending}
                                            >
                                                save
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                            {member?.role === "admin" && (
                                <button
                                    onClick={handleDelete}
                                    disabled={updateIsPending || removeIsPending}
                                    className="flex items-center gap-x-2 px-5 py-4 bg-white rounded-lg cursor-pointer border hover:bg-gray-50 text-rose-500"
                                >
                                    <TrashIcon className="size-4"/>
                                    <p className="text-sm font-semibold">Delete channel</p>
                                </button>
                            )}  
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}