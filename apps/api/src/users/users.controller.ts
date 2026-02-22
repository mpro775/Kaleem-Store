import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PERMISSIONS } from '../auth/constants/permission.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { getRequestContext } from '../common/utils/request-context.util';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { TenantGuard } from '../tenancy/guards/tenant.guard';
import { Public } from '../auth/decorators/public.decorator';
import { AcceptInviteDto, ValidateInviteDto } from './dto/accept-invite.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import {
  UsersService,
  type UserProfileResponse,
  type InviteResponse,
  type InviteValidationResponse,
} from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.usersRead)
  @ApiOkResponse({ description: 'List store users' })
  async list(@CurrentUser() user: AuthUser): Promise<UserProfileResponse[]> {
    return this.usersService.list(user);
  }

  @Get('me')
  @RequirePermissions(PERMISSIONS.usersRead)
  @ApiOkResponse({ description: 'Get current user profile' })
  async me(@CurrentUser() user: AuthUser): Promise<UserProfileResponse> {
    return this.usersService.getSelf(user);
  }

  @Get('invites')
  @RequirePermissions(PERMISSIONS.usersWrite)
  @ApiOkResponse({ description: 'List pending staff invites' })
  async listInvites(@CurrentUser() user: AuthUser): Promise<InviteResponse[]> {
    return this.usersService.listPendingInvites(user);
  }

  @Patch(':userId/role')
  @RequirePermissions(PERMISSIONS.usersWrite)
  @ApiOkResponse({ description: 'Update user role and permissions' })
  async updateRole(
    @CurrentUser() currentUser: AuthUser,
    @Param('userId') userId: string,
    @Body() body: UpdateUserRoleDto,
    @Req() request: Request,
  ): Promise<UserProfileResponse> {
    return this.usersService.updateRole(currentUser, userId, body, getRequestContext(request));
  }

  @Post('invite')
  @RequirePermissions(PERMISSIONS.usersWrite)
  @ApiOkResponse({ description: 'Invite a new staff member' })
  async inviteStaff(
    @CurrentUser() currentUser: AuthUser,
    @Body() body: InviteStaffDto,
    @Req() request: Request,
  ): Promise<InviteResponse> {
    return this.usersService.inviteStaff(currentUser, body, getRequestContext(request));
  }

  @Patch(':userId/disable')
  @RequirePermissions(PERMISSIONS.usersWrite)
  @ApiOkResponse({ description: 'Disable a user account' })
  async disableUser(
    @CurrentUser() currentUser: AuthUser,
    @Param('userId') userId: string,
    @Req() request: Request,
  ): Promise<UserProfileResponse> {
    return this.usersService.disableUser(currentUser, userId, getRequestContext(request));
  }

  @Patch(':userId/enable')
  @RequirePermissions(PERMISSIONS.usersWrite)
  @ApiOkResponse({ description: 'Enable a user account' })
  async enableUser(
    @CurrentUser() currentUser: AuthUser,
    @Param('userId') userId: string,
    @Req() request: Request,
  ): Promise<UserProfileResponse> {
    return this.usersService.enableUser(currentUser, userId, getRequestContext(request));
  }

  @Post('change-password')
  @RequirePermissions(PERMISSIONS.usersRead)
  @ApiOkResponse({ description: 'Change current user password' })
  async changePassword(
    @CurrentUser() currentUser: AuthUser,
    @Body() body: ChangePasswordDto,
    @Req() request: Request,
  ): Promise<void> {
    return this.usersService.changePassword(currentUser, body, getRequestContext(request));
  }
}

@ApiTags('auth')
@Controller('auth')
export class AuthStaffController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post('invite/validate')
  @ApiOkResponse({ description: 'Validate an invite token' })
  async validateInvite(@Body() body: ValidateInviteDto): Promise<InviteValidationResponse> {
    return this.usersService.validateInvite(body);
  }

  @Public()
  @Post('invite/accept')
  @ApiOkResponse({ description: 'Accept a staff invite' })
  async acceptInvite(@Body() body: AcceptInviteDto): Promise<UserProfileResponse> {
    return this.usersService.acceptInvite(body);
  }

  @Public()
  @Post('password-reset/request')
  @ApiOkResponse({ description: 'Request a password reset' })
  async requestPasswordReset(@Body() body: RequestPasswordResetDto): Promise<void> {
    return this.usersService.requestPasswordReset(body);
  }

  @Public()
  @Post('password-reset/confirm')
  @ApiOkResponse({ description: 'Reset password with token' })
  async resetPassword(@Body() body: ResetPasswordDto): Promise<void> {
    return this.usersService.resetPassword(body);
  }
}
