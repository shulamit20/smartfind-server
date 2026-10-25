import { FoundItem, LostReport, OwnershipRequest, User } from '@prisma/client';
import { Role } from '../../config/constants';

type RequestWithRelations = OwnershipRequest & { user: User; lostReport: LostReport; foundItem: FoundItem };

// Prisma `include` that loads everything the mapper needs
export const ownershipRequestInclude = { user: true, lostReport: true, foundItem: true } as const;

// What the requesting user sees – no hidden answer
function toUserShape(request: RequestWithRelations) {
  return {
    id: request.id,
    status: request.status,
    verificationQuestion: request.foundItem.verificationQuestion,
    answer: request.answer,
    rejectionReason: request.rejectionReason,
    reviewedAt: request.reviewedAt,
    createdAt: request.createdAt,
    lostReport: { id: request.lostReport.id, title: request.lostReport.title, status: request.lostReport.status },
    foundItem: { id: request.foundItem.id, title: request.foundItem.title, status: request.foundItem.status },
  };
}

// What the admin sees – question, user's answer and correct answer together, plus who asked
function toAdminShape(request: RequestWithRelations) {
  return {
    ...toUserShape(request),
    correctAnswer: request.foundItem.verificationAnswer,
    user: { id: request.user.id, fullName: request.user.fullName, email: request.user.email },
  };
}

export function toOwnershipRequestDto(request: RequestWithRelations, role: Role) {
  return role === Role.Admin ? toAdminShape(request) : toUserShape(request);
}
