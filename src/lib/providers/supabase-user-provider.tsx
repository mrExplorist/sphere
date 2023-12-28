// Defining a React context and a provider to manage Supabase user and subscription data, fetching and updating the information on component mount. It utilizes the Supabase authentication and a custom subscription status query, displaying toasts for unexpected errors. The provided context can be consumed using the useSupabaseUser hook

// We can use the user info and subscrition info in whole app

'use client';
import { AuthUser } from '@supabase/supabase-js';
import { Subscription } from '../supabase/supabase.types';
import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getUserSubscriptionStatus } from '../supabase/queries';
import { useToast } from '@/components/ui/use-toast';

// Define the shape of the SupabaseUser context
type SupabaseUserContextType = {
  user: AuthUser | null;
  subscription: Subscription | null;
};

// Create the SupabaseUserContext with initial values
const SupabaseUserContext = createContext<SupabaseUserContextType>({
  user: null,
  subscription: null,
});

// Custom hook to consume the SupabaseUserContext
export const useSupabaseUser = () => {
  return useContext(SupabaseUserContext);
};

// Define props for the SupabaseUserProvider component
interface SupabaseUserProviderProps {
  children: React.ReactNode;
}

// SupabaseUserProvider component to provide user and subscription data to its children
export const SupabaseUserProvider: React.FC<SupabaseUserProviderProps> = ({ children }) => {
  // TODO: // Fetch the user and subscription details

  // Local state to manage user and subscription data
  const [user, setUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Access the useToast hook for displaying toasts
  const { toast } = useToast();

  // Create a Supabase client instance using createClientComponentClient
  const supabase = createClientComponentClient();

  // Fetch user details and subscription status on component mount

  useEffect(() => {
    const getUser = async () => {
      // Fetch user details from Supabase Auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If user details are available
      if (user) {
        console.log(user);
        setUser(user);

        // Fetch user subscription status using a custom query
        const { data, error } = await getUserSubscriptionStatus(user.id);

        // Set the subscription state if data is available
        if (data) setSubscription(data);

        // Display a toast for unexpected errors
        if (error) {
          toast({
            title: 'Unexpected Error',
            description: 'Oops! An unexpected error happened. Try again later.',
          });
        }
      }
    };

    // Call the getUser function
    getUser();
  }, [supabase, toast]);

  // Provide user and subscription data to the context
  return <SupabaseUserContext.Provider value={{ user, subscription }}>{children}</SupabaseUserContext.Provider>;
};
