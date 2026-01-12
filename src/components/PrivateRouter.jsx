import { UserAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import LoadingLogo from './LoadingLogo';

const PrivateRouter = ({children}) => {

    const {session} = UserAuth()

    if (session === undefined){
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingLogo size="xl" />
            </div>
        );
    }

    const codeValidated = session?.user?.user_metadata?.code_validated;
    
    if (session && !codeValidated) {
        return <Navigate to='/signin' />
    }

    return (
    <>
        {session ? children : <Navigate to='/signup' />}
    </>
)
}

export default PrivateRouter; 