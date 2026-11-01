import { Linking, Platform } from 'react-native';

import type { Contact } from '@/data/persisted-state';

export type NotifyChannel = 'sms' | 'email';

/** Which ways we can reach the contact, based on what they filled in. */
export function availableChannels(contact: Contact): NotifyChannel[] {
  const channels: NotifyChannel[] = [];
  if (contact.phone) channels.push('sms');
  if (contact.email) channels.push('email');
  return channels;
}

/**
 * Opens the phone's own messaging or mail app with the message filled in. The user taps send
 * there, so no server or account is needed and nothing goes out without them confirming it.
 */
export async function notifyContact(contact: Contact, channel: NotifyChannel, words: string[]) {
  const body = `KeyBud message: ${words.join(' ')}`;

  const url =
    channel === 'sms'
      ? // iOS separates the body with "&", Android with "?".
        `sms:${contact.phone}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(body)}`
      : `mailto:${contact.email}?subject=${encodeURIComponent('Message from KeyBud')}&body=${encodeURIComponent(body)}`;

  await Linking.openURL(url);
}
