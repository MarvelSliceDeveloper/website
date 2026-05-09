import { GraphClient } from './graph.client';

export interface Subscription {
  id: string;
  resource: string;
  applicationId: string;
  changeType: string;
  clientState: string;
  notificationUrl: string;
  expirationDateTime: string;
  creatorId: string;
}

export async function createSubscription(resource: string, notificationUrl: string, expirationDateTime: string, clientState?: string): Promise<Subscription> {
  // Typically subscriptions are created using App Token
  const client = new GraphClient({ useAppToken: true });
  
  return client.post('/subscriptions', {
    changeType: 'created,updated,deleted',
    notificationUrl,
    resource,
    expirationDateTime,
    clientState: clientState || 'secretClientValue'
  }) as Promise<Subscription>;
}

export async function renewSubscription(subscriptionId: string, expirationDateTime: string): Promise<Subscription> {
  const client = new GraphClient({ useAppToken: true });
  return client.patch(`/subscriptions/${subscriptionId}`, {
    expirationDateTime
  }) as Promise<Subscription>;
}

export async function deleteSubscription(subscriptionId: string): Promise<void> {
  const client = new GraphClient({ useAppToken: true });
  await client.delete(`/subscriptions/${subscriptionId}`);
}
