import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../auth/constants/permission.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { TenantGuard } from '../tenancy/guards/tenant.guard';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('inbox')
  @RequirePermissions(PERMISSIONS.storeRead)
  @ApiOkResponse({ description: 'List store inbox notifications' })
  async listInbox(@CurrentUser() currentUser: AuthUser, @Query() query: ListNotificationsQueryDto) {
    return this.notificationsService.listStoreInbox(currentUser, {
      unreadOnly: query.unreadOnly ?? false,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      ...(query.type?.trim() ? { type: query.type.trim() } : {}),
    });
  }

  @Patch(':notificationId/read')
  @RequirePermissions(PERMISSIONS.storeWrite)
  @ApiOkResponse({ description: 'Mark a notification as read' })
  async markRead(
    @CurrentUser() currentUser: AuthUser,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ) {
    await this.notificationsService.markStoreNotificationRead(currentUser, notificationId);
    return { ok: true };
  }

  @Patch('read-all')
  @RequirePermissions(PERMISSIONS.storeWrite)
  @ApiOkResponse({ description: 'Mark all inbox notifications as read' })
  async markAllRead(@CurrentUser() currentUser: AuthUser) {
    return this.notificationsService.markAllStoreNotificationsRead(currentUser);
  }

  @Get('preferences')
  @RequirePermissions(PERMISSIONS.storeRead)
  @ApiOkResponse({ description: 'List notification preferences' })
  async listPreferences(@CurrentUser() currentUser: AuthUser) {
    return this.notificationsService.listStorePreferences(currentUser);
  }

  @Patch('preferences')
  @RequirePermissions(PERMISSIONS.storeWrite)
  @ApiOkResponse({ description: 'Update notification preferences' })
  async updatePreferences(
    @CurrentUser() currentUser: AuthUser,
    @Body() body: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updateStorePreferences(currentUser, body.preferences);
  }
}
