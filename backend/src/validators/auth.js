'use strict';

const { z } = require('zod');

const loginSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const forgotPasswordSchema = z.object({
  email: z.email('Email inválido'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

module.exports = { loginSchema, forgotPasswordSchema, resetPasswordSchema };
