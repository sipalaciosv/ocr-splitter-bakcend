import { z } from 'zod';

/**
 * Schema para crear un grupo
 */
export const CreateGroupSchema = z.object({
    title: z.string()
        .min(1, 'El título es requerido')
        .max(100, 'El título no puede exceder 100 caracteres'),
    items: z.array(z.object({
        id: z.string().uuid('ID de item inválido'),
        name: z.string().min(1, 'El nombre del item es requerido'),
        price: z.number().int().min(0, 'El precio debe ser mayor o igual a 0'),
        qty: z.number().int().min(1, 'La cantidad debe ser al menos 1').max(99, 'La cantidad no puede exceder 99'),
    })).min(1, 'Debe haber al menos un item'),
    includeTip: z.boolean().optional(),
    tipPercentage: z.number().int().min(0).max(100).optional(),
});

/**
 * Schema para actualizar un grupo
 */
export const UpdateGroupSchema = z.object({
    title: z.string()
        .min(1, 'El título es requerido')
        .max(100, 'El título no puede exceder 100 caracteres')
        .optional(),
});

/**
 * Schema para unirse a un grupo
 */
export const JoinGroupSchema = z.object({
    displayName: z.string().optional(),
    email: z.string().email('Email inválido').optional(),
    photoURL: z.string().url('URL de foto inválida').optional(),
});

/**
 * Schema para asignar un item
 */
export const AssignItemSchema = z.object({
    assignedUserIds: z.array(z.string()).min(0, 'assignedUserIds debe ser un array'),
});
