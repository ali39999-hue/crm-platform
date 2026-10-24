import { SetMetadata } from '@nestjs/common';
import type { PermissionAction } from '@crm/domain';

export const PERMISSION_KEY = 'required_permission';
export const RequirePermission = (action: PermissionAction) => SetMetadata(PERMISSION_KEY, action);
