import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext()

export const AuthContextProvider = ({children}) => {
    const [session, setSession] = useState(undefined)

    const signUpNewUser = async (email, password, name) => {
        const {data, error} = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                },
                emailRedirectTo: `${window.location.origin}/signin`
            }
        });

        if(error){
            console.error(`there was a problem signing up: ${error}`)
            return {success: false, error}   
        }

        // Empty identities array means email already exists
        if (data?.user && data.user.identities && data.user.identities.length === 0) {
            return {
                success: false, 
                error: { message: 'You already have an account! Please sign in instead.' }
            }
        }

        return {success: true, data}
    }

    // Listen for auth state changes across tabs
    useEffect(() => {
        supabase.auth.getSession().then(({data: { session } }) => {
            setSession(session)
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription?.unsubscribe()
    }, [])

    const signInUser = async (email, password)=> {
        try {
            const {data, error} = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            })
            if(error){
                console.error("an error occured: ", error)
                return {success: false, error: error.message}
            }
            console.log('signing in, success!', data);
            return {success: true, data}
        } catch(error){
            console.error(`There was an error loging in: ${error}`)
            return { success: false, error}
        }
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if(error){
            console.error(`unable to sign out: ${error}`)
        }
    }

    const signInWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        })
        
        if(error){
            console.error('Error signing in with Google:', error)
            return { success: false, error }
        }
        
        return { success: true, data }
    }

    const validateAccessCode = async (code) => {
        try {
            const user = session?.user;
            if (!user) {
                return { success: false, error: 'User not authenticated' };
            }

            const { data: codeData, error: fetchError } = await supabase
                .from('access_codes')
                .select('*')
                .eq('code', code)
                .eq('used', false)
                .single();

            if (fetchError || !codeData) {
                return { success: false, error: 'Invalid or already used access code' };
            }

            // Atomic update to prevent race conditions
            const { error: updateError } = await supabase
                .from('access_codes')
                .update({ 
                    used: true, 
                    used_by: user.id,
                    used_at: new Date().toISOString()
                })
                .eq('code', code)
                .eq('used', false);

            if (updateError) {
                console.error('Error updating code:', updateError);
                return { success: false, error: 'Code already used by another user' };
            }

            const { error: metadataError } = await supabase.auth.updateUser({
                data: { 
                    code_validated: true,
                    access_code_used: code
                }
            });

            if (metadataError) {
                console.error('Error updating user metadata:', metadataError);
            }

            return { success: true };
        } catch (error) {
            console.error('Error validating access code:', error);
            return { success: false, error: 'An error occurred' };
    }
}

    return (
        <AuthContext.Provider value={{session, signUpNewUser, signOut, signInUser, signInWithGoogle, validateAccessCode}}>
            {children}
        </AuthContext.Provider>
    )

}

export const UserAuth = () => {
    return useContext(AuthContext)
}