'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useStore } from '@/store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, addCredits } = useStore();
    const supabase = createClient();

    useEffect(() => {
        // Check active session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);

            if (session?.user) {
                // Fetch credits from DB
                const { data, error } = await supabase
                    .from('users')
                    .select('credits')
                    .eq('id', session.user.id)
                    .single();

                if (data) {
                    useStore.setState({ credits: data.credits });
                }
            }
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user || null);

            if (session?.user) {
                const { data } = await supabase
                    .from('users')
                    .select('credits')
                    .eq('id', session.user.id)
                    .single();
                if (data) {
                    useStore.setState({ credits: data.credits });
                }
            } else {
                // Clear sensitive data on logout
                useStore.setState({ credits: 0 }); // Or keep local credits? Strategy decision.
            }
        });

        return () => subscription.unsubscribe();
    }, [setUser]);

    return <>{children}</>;
}
