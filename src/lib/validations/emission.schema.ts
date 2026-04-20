import { z } from "zod";

export const createEmissionSchema = z.object({
  activityId: z.string().min(1, "Activity is required"),
  emissionFactorId: z.string().min(1, "Emission factor is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1),
  period: z.string().datetime(),
  notes: z.string().optional(),
});

export type CreateEmissionInput = z.infer<typeof createEmissionSchema>;

export const updateEmissionSchema = createEmissionSchema.partial();
export type UpdateEmissionInput = z.infer<typeof updateEmissionSchema>;
