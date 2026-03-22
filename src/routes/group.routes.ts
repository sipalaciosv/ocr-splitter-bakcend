import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as groupService from '../services/group.service.js';
import {
    CreateGroupSchema,
    UpdateGroupSchema,
    JoinGroupSchema,
    AssignItemSchema,
} from '../schemas/group.schema.js';
import { CreateGroupRequest, UpdateGroupRequest, JoinGroupRequest, AssignItemRequest } from '../types/index.js';

const router = Router();

// Todos los endpoints requieren autenticación
router.use(authMiddleware);

/**
 * POST /api/groups
 * Crear un nuevo grupo con items del OCR
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        // Validar request body
        const validatedData = CreateGroupSchema.parse(req.body) as CreateGroupRequest;

        const groupId = uuidv4();
        const userId = (req as any).user.uid;
        const userProfile = {
            displayName: (req as any).user.display_name,
            email: (req as any).user.email,
            photoURL: (req as any).user.picture,
        };

        await groupService.createGroupWithItems(
            groupId,
            validatedData.title,
            userId,
            userProfile,
            validatedData.items,
            validatedData.includeTip,
            validatedData.tipPercentage
        );

        res.status(201).json({
            success: true,
            groupId,
        });
    } catch (error: any) {
        console.error('Error creating group:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Error al crear el grupo',
        });
    }
});

/**
 * GET /api/groups/:id
 * Obtener detalles de un grupo
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const groupId = req.params.id;
        const userId = (req as any).user.uid;

        const group = await groupService.getGroupById(groupId, userId);

        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Grupo no encontrado',
            });
        }

        res.json({
            success: true,
            group: {
                id: groupId,
                ...group,
                createdAt: (group.createdAt as any)?.toDate?.().toISOString() || new Date().toISOString(),
            },
        });
    } catch (error: any) {
        console.error('Error getting group:', error);
        const status = error.message.includes('permiso') ? 403 : 500;
        res.status(status).json({
            success: false,
            error: error.message || 'Error al obtener el grupo',
        });
    }
});

/**
 * PUT /api/groups/:id
 * Actualizar un grupo (solo admin)
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const validatedData = UpdateGroupSchema.parse(req.body) as UpdateGroupRequest;
        const groupId = req.params.id;
        const userId = (req as any).user.uid;

        await groupService.updateGroup(groupId, userId, validatedData);

        res.json({
            success: true,
            message: 'Grupo actualizado exitosamente',
        });
    } catch (error: any) {
        console.error('Error updating group:', error);
        const status = error.message.includes('administradores') ? 403 : 400;
        res.status(status).json({
            success: false,
            error: error.message || 'Error al actualizar el grupo',
        });
    }
});

/**
 * DELETE /api/groups/:id
 * Eliminar un grupo (solo admin)
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const groupId = req.params.id;
        const userId = (req as any).user.uid;

        await groupService.deleteGroup(groupId, userId);

        res.json({
            success: true,
            message: 'Grupo eliminado exitosamente',
        });
    } catch (error: any) {
        console.error('Error deleting group:', error);
        const status = error.message.includes('administradores') ? 403 : 500;
        res.status(status).json({
            success: false,
            error: error.message || 'Error al eliminar el grupo',
        });
    }
});

/**
 * GET /api/groups/:id/members
 * Listar miembros de un grupo
 */
router.get('/:id/members', async (req: Request, res: Response) => {
    try {
        const groupId = req.params.id;
        const userId = (req as any).user.uid;

        const members = await groupService.getGroupMembers(groupId, userId);

        res.json({
            success: true,
            members,
        });
    } catch (error: any) {
        console.error('Error getting members:', error);
        const status = error.message.includes('permiso') ? 403 : 500;
        res.status(status).json({
            success: false,
            error: error.message || 'Error al obtener miembros',
        });
    }
});

/**
 * POST /api/groups/:id/members
 * Unirse a un grupo (join)
 */
router.post('/:id/members', async (req: Request, res: Response) => {
    try {
        const validatedData = JoinGroupSchema.parse(req.body) as JoinGroupRequest;
        const groupId = req.params.id;
        const userId = (req as any).user.uid;

        const profile = {
            displayName: validatedData.displayName || (req as any).user.display_name,
            email: validatedData.email || (req as any).user.email,
            photoURL: validatedData.photoURL || (req as any).user.picture,
        };

        await groupService.addMember(groupId, userId, profile);

        res.status(201).json({
            success: true,
            message: 'Te uniste al grupo exitosamente',
        });
    } catch (error: any) {
        console.error('Error joining group:', error);
        const status = error.message.includes('no existe') ? 404 : 400;
        res.status(status).json({
            success: false,
            error: error.message || 'Error al unirse al grupo',
        });
    }
});

/**
 * DELETE /api/groups/:id/members/:uid
 * Remover un miembro del grupo (solo admin)
 */
router.delete('/:id/members/:uid', async (req: Request, res: Response) => {
    try {
        const groupId = req.params.id;
        const adminUid = (req as any).user.uid;
        const targetUid = req.params.uid;

        await groupService.removeMember(groupId, adminUid, targetUid);

        res.json({
            success: true,
            message: 'Miembro removido exitosamente',
        });
    } catch (error: any) {
        console.error('Error removing member:', error);
        const status = error.message.includes('administradores') ? 403 : 400;
        res.status(status).json({
            success: false,
            error: error.message || 'Error al remover miembro',
        });
    }
});

/**
 * GET /api/groups/:id/items
 * Listar items de un grupo
 */
router.get('/:id/items', async (req: Request, res: Response) => {
    try {
        const groupId = req.params.id;
        const userId = (req as any).user.uid;

        const items = await groupService.getGroupItems(groupId, userId);

        res.json({
            success: true,
            items,
        });
    } catch (error: any) {
        console.error('Error getting items:', error);
        const status = error.message.includes('permiso') ? 403 : 500;
        res.status(status).json({
            success: false,
            error: error.message || 'Error al obtener items',
        });
    }
});

/**
 * PUT /api/groups/:id/items/:itemId
 * Asignar un item a usuarios (solo admin)
 */
router.put('/:id/items/:itemId', async (req: Request, res: Response) => {
    try {
        const validatedData = AssignItemSchema.parse(req.body) as AssignItemRequest;
        const groupId = req.params.id;
        const itemId = req.params.itemId;
        const userId = (req as any).user.uid;

        await groupService.assignItem(groupId, itemId, userId, validatedData.assignedUserIds);

        res.json({
            success: true,
            message: 'Item asignado exitosamente',
        });
    } catch (error: any) {
        console.error('Error assigning item:', error);
        const status = error.message.includes('administradores') ? 403 : 400;
        res.status(status).json({
            success: false,
            error: error.message || 'Error al asignar item',
        });
    }
});

/**
 * POST /api/groups/:id/items/:itemId/claim
 * Usuario se asigna a sí mismo un item
 */
router.post('/:id/items/:itemId/claim', async (req: Request, res: Response) => {
    try {
        const groupId = req.params.id;
        const itemId = req.params.itemId;
        const userId = (req as any).user.uid;

        await groupService.claimItem(groupId, itemId, userId);

        res.json({
            success: true,
            message: 'Te asignaste el item exitosamente',
        });
    } catch (error: any) {
        console.error('Error claiming item:', error);
        const status = error.message.includes('miembro') ? 403 : 400;
        res.status(status).json({
            success: false,
            error: error.message || 'Error al reclamar item',
        });
    }
});

/**
 * DELETE /api/groups/:id/items/:itemId/claim
 * Usuario se desasigna de un item
 */
router.delete('/:id/items/:itemId/claim', async (req: Request, res: Response) => {
    try {
        const groupId = req.params.id;
        const itemId = req.params.itemId;
        const userId = (req as any).user.uid;

        await groupService.unclaimItem(groupId, itemId, userId);

        res.json({
            success: true,
            message: 'Te desasignaste del item exitosamente',
        });
    } catch (error: any) {
        console.error('Error unclaiming item:', error);
        const status = error.message.includes('miembro') ? 403 : 400;
        res.status(status).json({
            success: false,
            error: error.message || 'Error al desasignar item',
        });
    }
});

export default router;
