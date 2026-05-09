import { GraphClient } from './graph.client';

export interface MsUserProfile {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string;
  jobTitle?: string;
  mobilePhone?: string;
  officeLocation?: string;
  preferredLanguage?: string;
}

export async function getMsUserProfile(userId: string): Promise<MsUserProfile> {
  const client = new GraphClient({ userId });
  return client.get('/me') as Promise<MsUserProfile>;
}
