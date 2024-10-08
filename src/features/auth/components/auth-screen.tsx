"use client"

import { useState } from "react";
import { SignInFlow } from "../types";
import { SignInCard } from "./sign-in-card";
import { SignUpCard } from "./sign-up-card";

type Props = {
 
}
export const AuthScreen = ({}: Props) => {
    const [state, setState] = useState<SignInFlow>("signIn")

    return ( 
        <div className="min-h-dvh py-6 flex items-center justify-center bg-[#5C3B58] overflow-auto">
            <div className="md:h-auto md:w-[420px]">
                {state === "signIn" ? <SignInCard setState={setState} /> : <SignUpCard setState={setState} />}
            </div>
        </div>
    );
}