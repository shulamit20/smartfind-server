import { Category, Color, FoundItem, Location } from '@prisma/client';
import { Role } from '../../config/constants';
import { toLookupDto } from '../lookups/lookups.mapper';

type FoundItemWithLookups = FoundItem & { category: Category; color: Color; location: Location };

// Public shape – safe for every logged-in user. verificationAnswer is NOT here.
export function toPublicFoundItem(item: FoundItemWithLookups) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category: toLookupDto(item.category),
    color: toLookupDto(item.color),
    location: toLookupDto(item.location),
    foundDate: item.foundDate,
    verificationQuestion: item.verificationQuestion,
    status: item.status,
    createdAt: item.createdAt,
  };
}

// Admin shape – the public shape plus the hidden answer
export function toAdminFoundItem(item: FoundItemWithLookups) {
  return { ...toPublicFoundItem(item), verificationAnswer: item.verificationAnswer };
}

// Picks the right shape for the current user's role
export function toFoundItemDto(item: FoundItemWithLookups, role: Role) {
  return role === Role.Admin ? toAdminFoundItem(item) : toPublicFoundItem(item);
}
