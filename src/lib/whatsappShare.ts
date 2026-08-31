export function shareViaWhatsApp(text: string): void {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
}

export function buildVisitShareText(params: {
  institutionName: string;
  visitDate?: string | null;
  visitBrand?: string | null;
  status?: string | null;
  employeeName?: string;
  notes?: string | null;
}): string {
  const lines: string[] = [
    `🏫 *Visit Report — ONROL*`,
    ``,
    `Institution: ${params.institutionName}`,
  ];
  if (params.visitDate) lines.push(`Date: ${params.visitDate}`);
  if (params.visitBrand) lines.push(`Brand: ${params.visitBrand}`);
  if (params.status) lines.push(`Status: ${params.status}`);
  if (params.employeeName) lines.push(`Field Rep: ${params.employeeName}`);
  if (params.notes) lines.push(``, `Notes: ${params.notes}`);
  lines.push(``, `_Shared via ONROL Task Manager_`);
  return lines.join("\n");
}

export function buildTaskShareText(params: {
  taskTitle: string;
  assignedTo?: string | null;
  status?: string | null;
  dueDate?: string | null;
}): string {
  const lines: string[] = [
    `📋 *Task Update — ONROL*`,
    ``,
    `Task: ${params.taskTitle}`,
  ];
  if (params.assignedTo) lines.push(`Assigned: ${params.assignedTo}`);
  if (params.status) lines.push(`Status: ${params.status}`);
  if (params.dueDate) lines.push(`Due: ${params.dueDate}`);
  lines.push(``, `_Shared via ONROL Task Manager_`);
  return lines.join("\n");
}

export function buildMeetingShareText(params: {
  roomCode: string;
  roomName?: string;
  hostName?: string;
  meetingLink: string;
}): string {
  const lines: string[] = [
    `🎥 *Meeting Invite — ONROL Meet*`,
    ``,
    `${params.roomName || "Team Meeting"}`,
    ``,
    `Join with code: *${params.roomCode}*`,
    `Or click: ${params.meetingLink}`,
  ];
  if (params.hostName) lines.push(``, `Host: ${params.hostName}`);
  lines.push(``, `_Sent via ONROL Task Manager_`);
  return lines.join("\n");
}
