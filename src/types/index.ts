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
    hasSuggestedTip?: boolean;  // true if receipt includes "PROPINA SUGERIDA"
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
 * Group document structure in Firestore
 */
export interface Group {
    title: string;
    ownerUid: string;
    createdAt: Date;
    includeTip?: boolean;      // Si el grupo incluye propina
    tipPercentage?: number;    // Porcentaje de propina (ej: 10)
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

// ==================== API Request/Response Types ====================

/**
 * Request body for creating a new group
 */
export interface CreateGroupRequest {
    title: string;
    items: Array<{
        id: string;
        name: string;
        price: number;
        qty: number;
    }>;
    includeTip?: boolean;      // Si se incluye propina
    tipPercentage?: number;    // Porcentaje de propina (ej: 10)
}

/**
 * Response after creating a group
 */
export interface CreateGroupResponse {
    success: boolean;
    groupId?: string;
    error?: string;
}

/**
 * Request body for updating a group
 */
export interface UpdateGroupRequest {
    title?: string;
}

/**
 * Request body for joining a group
 */
export interface JoinGroupRequest {
    displayName?: string;
    email?: string;
    photoURL?: string;
}

/**
 * Request body for assigning an item to users
 */
export interface AssignItemRequest {
    assignedUserIds: string[];
}

/**
 * Member info for responses
 */
export interface MemberResponse {
    uid: string;
    role: 'admin' | 'member';
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    joinedAt: string;
}

/**
 * Item info for responses
 */
export interface ItemResponse {
    id: string;
    name: string;
    price: number;
    qty: number;
    assignedUserIds: string[];
}

/**
 * Group details response
 */
export interface GroupResponse {
    success: boolean;
    group?: {
        id: string;
        title: string;
        ownerUid: string;
        createdAt: string;
    };
    error?: string;
}

/**
 * Generic success response
 */
export interface ApiResponse {
    success: boolean;
    message?: string;
    error?: string;
}
