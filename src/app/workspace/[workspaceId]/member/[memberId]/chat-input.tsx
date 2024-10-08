import { useCreateMessage } from "@/features/messages/api/use-create-message";
import { useGenerateUploadUrl } from "@/features/upload/api/use-create-upload-url";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import dynamic from "next/dynamic";
import Quill from "quill";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Id } from "../../../../../../convex/_generated/dataModel";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false })

type CreateMessageValues = {
    conversationId: Id<"conversations">
    workspaceId: Id<"workspaces">,
    body: string,
    image?: Id<"_storage">,
}

type Props = {
    placeholder: string;
    conversationId: Id<"conversations">
}
export const ChatInput = ({
    placeholder,
    conversationId
}: Props) => {
    const [editorKey, setEditorKey] = useState(0);
    const [isPending, setIsPendeing] = useState(false);

    const editorRef = useRef<Quill | null>(null);

    const workspaceId = useWorkspaceId();

    const { mutate: generateUploadUrl } = useGenerateUploadUrl();
    const { mutate: createMessage } = useCreateMessage();

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
                conversationId,
                workspaceId,
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

    return ( 
        <div className="px-5 w-full">
            <Editor
                key={editorKey}
                placeholder={placeholder}
                onSubmit={handleSubmit}
                disabled={isPending}
                innerRef={editorRef}
            />
        </div>
    );
}