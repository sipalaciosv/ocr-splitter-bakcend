import { db } from '../config/firebase.js';
import { Group, Member, Item, MemberResponse, ItemResponse } from '../types/index.js';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Crear un grupo con items
 * Esta es una operación atómica que crea el grupo, agrega al owner como admin, y siembra los items
 */
export async function createGroupWithItems(
    groupId: string,
    title: string,
    ownerUid: string,
    ownerProfile: { displayName?: string; email?: string; photoURL?: string },
    items: Array<{ id: string; name: string; price: number; qty: number }>,
    includeTip?: boolean,
    tipPercentage?: number
): Promise<void> {
    const batch = db.batch();

    // 1. Crear el documento del grupo
    const groupRef = db.collection('groups').doc(groupId);
    batch.set(groupRef, {
        title,
        ownerUid,
        createdAt: FieldValue.serverTimestamp(),
        ...(includeTip !== undefined && { includeTip }),
        ...(tipPercentage !== undefined && { tipPercentage }),
    } as any);

    // 2. Agregar al owner como admin
    const memberRef = groupRef.collection('members').doc(ownerUid);
    batch.set(memberRef, {
        role: 'admin',
        joinedAt: FieldValue.serverTimestamp(),
        displayName: ownerProfile.displayName || null,
        email: ownerProfile.email || null,
        photoURL: ownerProfile.photoURL || null,
    } as any);

    // 3. Agregar los items
    for (const item of items) {
        const itemRef = groupRef.collection('items').doc(item.id);
        batch.set(itemRef, {
            name: item.name,
            price: item.price,
            qty: item.qty,
            assignedUserIds: [],
        } as Item);
    }

    await batch.commit();
}

/**
 * Obtener detalles de un grupo
 * Verifica que el usuario sea miembro antes de retornar
 */
export async function getGroupById(groupId: string, userId: string): Promise<Group | null> {
    // Verificar que el usuario es miembro
    const isMember = await isUserMember(groupId, userId);
    if (!isMember) {
        throw new Error('No tienes permiso para ver este grupo');
    }

    const groupDoc = await db.collection('groups').doc(groupId).get();

    if (!groupDoc.exists) {
        return null;
    }

    return groupDoc.data() as Group;
}

/**
 * Actualizar un grupo (solo admin)
 */
export async function updateGroup(
    groupId: string,
    userId: string,
    updates: { title?: string }
): Promise<void> {
    // Verificar que el usuario es admin
    const isAdmin = await isUserAdmin(groupId, userId);
    if (!isAdmin) {
        throw new Error('Solo los administradores pueden actualizar el grupo');
    }

    await db.collection('groups').doc(groupId).update(updates);
}

/**
 * Eliminar un grupo (solo admin)
 */
export async function deleteGroup(groupId: string, userId: string): Promise<void> {
    // Verificar que el usuario es admin
    const isAdmin = await isUserAdmin(groupId, userId);
    if (!isAdmin) {
        throw new Error('Solo los administradores pueden eliminar el grupo');
    }

    // Eliminar subcolecciones y luego el grupo
    const batch = db.batch();

    // Eliminar members
    const membersSnapshot = await db.collection('groups').doc(groupId).collection('members').get();
    membersSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Eliminar items
    const itemsSnapshot = await db.collection('groups').doc(groupId).collection('items').get();
    itemsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Eliminar grupo
    batch.delete(db.collection('groups').doc(groupId));

    await batch.commit();
}

/**
 * Obtener todos los miembros de un grupo
 */
export async function getGroupMembers(groupId: string, userId: string): Promise<MemberResponse[]> {
    // Verificar que el usuario es miembro
    const isMember = await isUserMember(groupId, userId);
    if (!isMember) {
        throw new Error('No tienes permiso para ver los miembros de este grupo');
    }

    const membersSnapshot = await db.collection('groups').doc(groupId).collection('members').get();

    return membersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...(doc.data() as Member),
        joinedAt: doc.data().joinedAt?.toDate().toISOString() || new Date().toISOString(),
    }));
}

/**
 * Agregar un miembro al grupo (join)
 */
export async function addMember(
    groupId: string,
    newMemberUid: string,
    profile: { displayName?: string; email?: string; photoURL?: string }
): Promise<void> {
    // Verificar que el grupo existe
    const groupDoc = await db.collection('groups').doc(groupId).get();
    if (!groupDoc.exists) {
        throw new Error('El grupo no existe');
    }

    // Agregar miembro
    await db.collection('groups').doc(groupId).collection('members').doc(newMemberUid).set({
        role: 'member',
        joinedAt: FieldValue.serverTimestamp(),
        displayName: profile.displayName || null,
        email: profile.email || null,
        photoURL: profile.photoURL || null,
    } as any);
}

/**
 * Remover un miembro del grupo (solo admin)
 */
export async function removeMember(
    groupId: string,
    adminUid: string,
    targetUid: string
): Promise<void> {
    // Verificar que el usuario es admin
    const isAdmin = await isUserAdmin(groupId, adminUid);
    if (!isAdmin) {
        throw new Error('Solo los administradores pueden remover miembros');
    }

    // No permitir que se remueva al owner
    const groupDoc = await db.collection('groups').doc(groupId).get();
    const ownerUid = (groupDoc.data() as Group).ownerUid;

    if (targetUid === ownerUid) {
        throw new Error('No se puede remover al creador del grupo');
    }

    await db.collection('groups').doc(groupId).collection('members').doc(targetUid).delete();
}

/**
 * Obtener todos los items de un grupo
 */
export async function getGroupItems(groupId: string, userId: string): Promise<ItemResponse[]> {
    // Verificar que el usuario es miembro
    const isMember = await isUserMember(groupId, userId);
    if (!isMember) {
        throw new Error('No tienes permiso para ver los items de este grupo');
    }

    const itemsSnapshot = await db.collection('groups').doc(groupId).collection('items').get();

    return itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Item),
    }));
}

/**
 * Asignar un item a usuarios (admin puede asignar a cualquiera)
 */
export async function assignItem(
    groupId: string,
    itemId: string,
    userId: string,
    assignedUserIds: string[]
): Promise<void> {
    // Verificar que el usuario es admin
    const isAdmin = await isUserAdmin(groupId, userId);
    if (!isAdmin) {
        throw new Error('Solo los administradores pueden asignar items');
    }

    await db.collection('groups').doc(groupId).collection('items').doc(itemId).update({
        assignedUserIds,
    });
}

/**
 * Usuario se asigna a sí mismo un item (claim)
 */
export async function claimItem(
    groupId: string,
    itemId: string,
    userId: string
): Promise<void> {
    // Verificar que el usuario es miembro
    const isMember = await isUserMember(groupId, userId);
    if (!isMember) {
        throw new Error('Debes ser miembro del grupo para reclamar items');
    }

    // Agregar userId a assignedUserIds (usar arrayUnion para evitar duplicados)
    await db.collection('groups').doc(groupId).collection('items').doc(itemId).update({
        assignedUserIds: FieldValue.arrayUnion(userId),
    });
}

/**
 * Usuario se desasigna de un item (unclaim)
 */
export async function unclaimItem(
    groupId: string,
    itemId: string,
    userId: string
): Promise<void> {
    // Verificar que el usuario es miembro
    const isMember = await isUserMember(groupId, userId);
    if (!isMember) {
        throw new Error('Debes ser miembro del grupo');
    }

    // Remover userId de assignedUserIds
    await db.collection('groups').doc(groupId).collection('items').doc(itemId).update({
        assignedUserIds: FieldValue.arrayRemove(userId),
    });
}

// ==================== Helper Functions ====================

/**
 * Verificar si un usuario es miembro de un grupo
 */
async function isUserMember(groupId: string, userId: string): Promise<boolean> {
    const memberDoc = await db.collection('groups').doc(groupId).collection('members').doc(userId).get();
    return memberDoc.exists;
}

/**
 * Verificar si un usuario es admin de un grupo
 */
async function isUserAdmin(groupId: string, userId: string): Promise<boolean> {
    const memberDoc = await db.collection('groups').doc(groupId).collection('members').doc(userId).get();

    if (!memberDoc.exists) {
        return false;
    }

    const member = memberDoc.data() as Member;
    return member.role === 'admin';
}
