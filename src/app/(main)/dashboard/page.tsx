import DashboardSetup from "@/components/dashboard-setup/dashboard-setup";
import db from "@/lib/supabase/db";
import { getUserSubscriptionStatus } from "@/lib/supabase/queries";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

const DashboardPage = async () => {
  const supabase = createServerComponentClient({ cookies });

  // Fetch from the user

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const workspace = await db.query.workspaces.findFirst({
    where: (workspace, { eq }) => eq(workspace.workspaceOwner, user.id),
  });

  // Getting the subscription status

  // TODO: Add the subscription status to the user table and fetch it from there instead of the subscription table to avoid an extra query to the database and make it more efficient and faster

  // TODO: getUserSubscriptionStatus function

  const { data: subscription, error: subscriptionError } =
    await getUserSubscriptionStatus(user.id);

  if (subscriptionError) {
    console.log(subscriptionError);
    return;
  }

  if (!workspace)
    return (
      <div className="bg-background h-screen w-screen flex justify-center items-center">
        <DashboardSetup
          user={user}
          subscription={subscription}
        ></DashboardSetup>
      </div>
    );

  redirect(`/dashboard/${workspace.id}`);

  return <div>DashboardPage</div>;
};

export default DashboardPage;
