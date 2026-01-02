/**
 * TypeScript type definitions for OCR Splitter backend
 */

/**
 * Item extracted from receipt via OCR
 */
export interface OcrItem {
    id: string;
    name: string;
    price: number;
    qty: number;
}

/**
 * Response from OCR processing endpoint
 */
export interface OcrResponse {
    success: boolean;
    items?: OcrItem[];
    error?: string;
}

/**
 * Firebase authenticated user attached to request
 */
export interface AuthenticatedUser {
    uid: string;
    email?: string;
    displayName?: string;
}

/**
 * Group structure in Firestore
 */
export interface Group {
    title: string;
    ownerUid: string;
    createdAt: Date;
}

/**
 * Member structure in Firestore (subcollection of groups)
 */
export interface Member {
    role: 'admin' | 'member';
    joinedAt: Date;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
}

/**
 * Item structure in Firestore (subcollection of groups)
 */
export interface Item {
    name: string;
    price: number;
    qty: number;
    assignedUserIds: string[];
}
