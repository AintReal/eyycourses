import { UserAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const PrivateRouter = ({children}) => {

    const {session} = UserAuth()

    if (session === undefined){
        return <p>Loading...</p>
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