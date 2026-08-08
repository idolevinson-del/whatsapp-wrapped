/** Tries to extract the chat/group name from a WhatsApp export filename. */
export function parseChatName(
  fileName: string,
  senderNames: string[]
): { name: string; isGroup: boolean } {
  const base = fileName.replace(/\.(zip|txt)$/i, '').trim();

  // "WhatsApp Chat with Name"
  const withMatch = base.match(/^WhatsApp\s+Chat\s+with\s+(.+)$/i);
  if (withMatch) return { name: withMatch[1].trim(), isGroup: false };

  // "WhatsApp Chat - Group Name"
  const dashMatch = base.match(/^WhatsApp\s+Chat\s+-\s+(.+)$/i);
  if (dashMatch) return { name: dashMatch[1].trim(), isGroup: true };

  // Hebrew "שיחת WhatsApp עם Name"
  const heWithMatch = base.match(/שיחת\s+WhatsApp\s+עם\s+(.+)$/);
  if (heWithMatch) return { name: heWithMatch[1].trim(), isGroup: false };

  // Hebrew group "שם הקבוצה - WhatsApp" or just group name
  const heGroupMatch = base.match(/^(.+)\s+-\s+WhatsApp$/);
  if (heGroupMatch) return { name: heGroupMatch[1].trim(), isGroup: senderNames.length >= 3 };

  // Fall back to sender names
  const isGroup = senderNames.length >= 3;
  if (!isGroup && senderNames.length === 2) {
    return { name: senderNames.map((n) => n.split(' ')[0]).join(' & '), isGroup: false };
  }
  return { name: '', isGroup };
}
