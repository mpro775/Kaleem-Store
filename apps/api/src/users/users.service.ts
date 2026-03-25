import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../audit/audit.service';
import { AuthRepository } from '../auth/auth.repository';
import type { RequestContextData } from '../common/utils/request-context.util';
import type { AuthUser, StoreRole } from '../auth/interfaces/auth-user.interface';
import { SaasService } from '../saas/saas.service';
import type { InviteStaffDto } from './dto/invite-staff.dto';
import type { AcceptInviteDto, ValidateInviteDto } from './dto/accept-invite.dto';
import type { RequestPasswordResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { UpdateUserRoleDto } from './dto/update-user-role.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UsersRepository,
  type UserProfileRecord,
  type StaffInviteRecord,
  type SessionRecord,
} from './users.repository';

export interface UserProfileResponse {
  id: string;
  storeId: string;
  email: string;
  fullName: string;
  role: StoreRole;
  permissions: string[];
  isActive: boolean;
}

export interface InviteResponse {
  id: string;
  email: string;
  fullName: string;
  role: StoreRole;
  expiresAt: Date;
  inviteToken?: string;
}

export interface InviteValidationResponse {
  valid: boolean;
  email: string;
  fullName: string;
  storeName?: string;
}

export interface SessionResponse {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
  isRevoked: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authRepository: AuthRepository,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly saasService: SaasService,
  ) {}

  async getSelf(currentUser: AuthUser): Promise<UserProfileResponse> {
    const user = await this.usersRepository.findById(currentUser.id);
    if (!user || !user.is_active) {
      throw new NotFoundException('User not found');
    }
    return this.toResponse(user);
  }

  async list(currentUser: AuthUser): Promise<UserProfileResponse[]> {
    const users = await this.usersRepository.listByStore(currentUser.storeId);
    return users.map((user) => this.toResponse(user));
  }

  async updateRole(
    currentUser: AuthUser,
    targetUserId: string,
    input: UpdateUserRoleDto,
    context: RequestContextData,
  ): Promise<UserProfileResponse> {
    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owner can change roles');
    }

    if (currentUser.id === targetUserId && input.role !== 'owner') {
      throw new BadRequestException('Owner cannot demote self');
    }

    const permissions = input.permissions ?? this.defaultPermissionsForRole(input.role);
    const updated = await this.usersRepository.updateRoleAndPermissions({
      storeId: currentUser.storeId,
      userId: targetUserId,
      role: input.role,
      permissions,
    });

    if (!updated) {
      throw new NotFoundException('Target user not found in this store');
    }

    await this.auditService.log({
      action: 'users.role_updated',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'store_user',
      targetId: targetUserId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        role: input.role,
        permissions,
      },
    });

    return this.toResponse(updated);
  }

  async inviteStaff(
    currentUser: AuthUser,
    input: InviteStaffDto,
    context: RequestContextData,
  ): Promise<InviteResponse> {
    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owner can invite staff');
    }

    const existingUser = await this.usersRepository.findByEmail(input.email);
    if (existingUser && existingUser.store_id === currentUser.storeId) {
      throw new ConflictException('User already exists in this store');
    }

    const existingInvite = await this.usersRepository.findPendingInviteByEmail(
      currentUser.storeId,
      input.email,
    );
    if (existingInvite) {
      await this.usersRepository.deletePendingInvites(currentUser.storeId, input.email);
    }

    const token = uuidv4();
    const tokenHash = await this.hashValue(token);
    const expiresAt = this.getInviteExpiryDate();
    const permissions = input.permissions ?? this.defaultPermissionsForRole(input.role);

    const inviteId = await this.usersRepository.createInvite({
      storeId: currentUser.storeId,
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      permissions,
      tokenHash,
      expiresAt,
      invitedByUserId: currentUser.id,
    });

    await this.auditService.log({
      action: 'users.staff_invited',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'staff_invite',
      targetId: inviteId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        email: input.email,
        role: input.role,
      },
    });

    return {
      id: inviteId,
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      expiresAt,
      inviteToken: token,
    };
  }

  async validateInvite(input: ValidateInviteDto): Promise<InviteValidationResponse> {
    const tokenHash = await this.hashValue(input.token);
    const invite = await this.usersRepository.findInviteByToken(tokenHash);

    if (!invite) {
      return { valid: false, email: '', fullName: '' };
    }

    if (invite.accepted_at) {
      return { valid: false, email: '', fullName: '' };
    }

    if (invite.expires_at.getTime() <= Date.now()) {
      return { valid: false, email: '', fullName: '' };
    }

    return {
      valid: true,
      email: invite.email,
      fullName: invite.full_name,
    };
  }

  async acceptInvite(input: AcceptInviteDto): Promise<UserProfileResponse> {
    const tokenHash = await this.hashValue(input.token);
    const invite = await this.usersRepository.findInviteByToken(tokenHash);

    if (!invite) {
      throw new NotFoundException('Invalid or expired invite token');
    }

    if (invite.accepted_at) {
      throw new BadRequestException('Invite already accepted');
    }

    if (invite.expires_at.getTime() <= Date.now()) {
      throw new BadRequestException('Invite has expired');
    }

    const existingUser = await this.usersRepository.findByEmail(invite.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    await this.saasService.assertMetricCanGrow(invite.store_id, 'staff.total', 1);

    const userId = uuidv4();
    const passwordHash = await this.hashValue(input.password);

    const user = await this.usersRepository.createStaffUser({
      userId,
      storeId: invite.store_id,
      email: invite.email,
      passwordHash,
      fullName: invite.full_name,
      role: invite.role,
      permissions: invite.permissions,
    });

    await this.usersRepository.acceptInvite({
      inviteId: invite.id,
      userId,
    });

    await this.auditService.log({
      action: 'users.invite_accepted',
      storeId: invite.store_id,
      storeUserId: userId,
      targetType: 'staff_invite',
      targetId: invite.id,
      ipAddress: null,
      userAgent: null,
      metadata: { email: invite.email },
    });

    return this.toResponse(user);
  }

  async disableUser(
    currentUser: AuthUser,
    targetUserId: string,
    context: RequestContextData,
  ): Promise<UserProfileResponse> {
    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owner can disable users');
    }

    if (currentUser.id === targetUserId) {
      throw new BadRequestException('Cannot disable yourself');
    }

    const targetUser = await this.usersRepository.findById(targetUserId);
    if (!targetUser || targetUser.store_id !== currentUser.storeId) {
      throw new NotFoundException('User not found in this store');
    }

    const updated = await this.usersRepository.setActiveStatus({
      storeId: currentUser.storeId,
      userId: targetUserId,
      isActive: false,
    });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    await this.authRepository.revokeAllSessionsForUser(targetUserId);

    await this.auditService.log({
      action: 'users.disabled',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'store_user',
      targetId: targetUserId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { requestId: context.requestId },
    });

    return this.toResponse(updated);
  }

  async enableUser(
    currentUser: AuthUser,
    targetUserId: string,
    context: RequestContextData,
  ): Promise<UserProfileResponse> {
    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owner can enable users');
    }

    const updated = await this.usersRepository.setActiveStatus({
      storeId: currentUser.storeId,
      userId: targetUserId,
      isActive: true,
    });

    if (!updated) {
      throw new NotFoundException('User not found in this store');
    }

    await this.auditService.log({
      action: 'users.enabled',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'store_user',
      targetId: targetUserId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { requestId: context.requestId },
    });

    return this.toResponse(updated);
  }

  async requestPasswordReset(input: RequestPasswordResetDto): Promise<void> {
    const user = await this.usersRepository.findByEmail(input.email);
    if (!user) {
      return;
    }

    const token = uuidv4();
    const tokenHash = await this.hashValue(token);
    const expiresAt = this.getPasswordResetExpiryDate();

    await this.usersRepository.createPasswordReset({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await this.auditService.log({
      action: 'users.password_reset_requested',
      storeId: user.store_id,
      storeUserId: user.id,
      ipAddress: null,
      userAgent: null,
      metadata: { email: input.email },
    });
  }

  async resetPassword(input: ResetPasswordDto): Promise<void> {
    const tokenHash = await this.hashValue(input.token);
    const reset = await this.usersRepository.findPasswordResetByToken(tokenHash);

    if (!reset) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    if (reset.used_at) {
      throw new BadRequestException('Reset token already used');
    }

    if (reset.expires_at.getTime() <= Date.now()) {
      throw new BadRequestException('Reset token has expired');
    }

    const passwordHash = await this.hashValue(input.password);
    await this.usersRepository.updatePassword({
      userId: reset.store_user_id,
      passwordHash,
    });

    await this.usersRepository.markPasswordResetUsed(reset.id);
    await this.authRepository.revokeAllSessionsForUser(reset.store_user_id);

    await this.auditService.log({
      action: 'users.password_reset_completed',
      storeId: null,
      storeUserId: reset.store_user_id,
      ipAddress: null,
      userAgent: null,
      metadata: {},
    });
  }

  async changePassword(
    currentUser: AuthUser,
    input: ChangePasswordDto,
    context: RequestContextData,
  ): Promise<void> {
    const user = await this.authRepository.findUserById(currentUser.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const valid = await argon2.verify(user.password_hash, input.currentPassword);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await this.hashValue(input.newPassword);
    await this.usersRepository.updatePassword({
      userId: currentUser.id,
      passwordHash,
    });

    await this.auditService.log({
      action: 'users.password_changed',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { requestId: context.requestId },
    });
  }

  async listPendingInvites(currentUser: AuthUser): Promise<InviteResponse[]> {
    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owner can view invites');
    }

    const invites = await this.usersRepository.listPendingInvites(currentUser.storeId);
    return invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      fullName: invite.full_name,
      role: invite.role,
      expiresAt: invite.expires_at,
    }));
  }

  async getUserById(currentUser: AuthUser, userId: string): Promise<UserProfileResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user || user.store_id !== currentUser.storeId) {
      throw new NotFoundException('User not found in this store');
    }
    return this.toResponse(user);
  }

  async updateProfile(
    currentUser: AuthUser,
    input: UpdateProfileDto,
    context: RequestContextData,
  ): Promise<UserProfileResponse> {
    if (!input.fullName && !input.phone) {
      throw new BadRequestException('At least one field must be provided');
    }

    const updated = await this.usersRepository.updateProfile({
      userId: currentUser.id,
      ...(input.fullName !== undefined && { fullName: input.fullName }),
      ...(input.phone !== undefined && { phone: input.phone }),
    });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    await this.auditService.log({
      action: 'users.profile_updated',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'store_user',
      targetId: currentUser.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { requestId: context.requestId },
    });

    return this.toResponse(updated);
  }

  async deleteUser(
    currentUser: AuthUser,
    targetUserId: string,
    context: RequestContextData,
  ): Promise<void> {
    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owner can delete users');
    }

    if (currentUser.id === targetUserId) {
      throw new BadRequestException('Cannot delete yourself');
    }

    const targetUser = await this.usersRepository.findById(targetUserId);
    if (!targetUser || targetUser.store_id !== currentUser.storeId) {
      throw new NotFoundException('User not found in this store');
    }

    if (targetUser.role === 'owner') {
      throw new BadRequestException('Cannot delete owner account');
    }

    await this.authRepository.revokeAllSessionsForUser(targetUserId);
    const deleted = await this.usersRepository.deleteUser(targetUserId, currentUser.storeId);

    if (!deleted) {
      throw new NotFoundException('User not found or cannot be deleted');
    }

    await this.auditService.log({
      action: 'users.deleted',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'store_user',
      targetId: targetUserId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { requestId: context.requestId },
    });
  }

  async cancelInvite(
    currentUser: AuthUser,
    inviteId: string,
    context: RequestContextData,
  ): Promise<void> {
    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owner can cancel invites');
    }

    const invite = await this.usersRepository.findInviteById(inviteId, currentUser.storeId);
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.accepted_at) {
      throw new BadRequestException('Invite already accepted');
    }

    await this.usersRepository.deleteInviteById(inviteId, currentUser.storeId);

    await this.auditService.log({
      action: 'users.invite_cancelled',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'staff_invite',
      targetId: inviteId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { requestId: context.requestId, email: invite.email },
    });
  }

  async resendInvite(
    currentUser: AuthUser,
    inviteId: string,
    context: RequestContextData,
  ): Promise<InviteResponse> {
    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owner can resend invites');
    }

    const invite = await this.usersRepository.findInviteById(inviteId, currentUser.storeId);
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.accepted_at) {
      throw new BadRequestException('Invite already accepted');
    }

    const token = uuidv4();
    const tokenHash = await this.hashValue(token);
    const expiresAt = this.getInviteExpiryDate();

    await this.usersRepository.updateInviteToken({
      inviteId: invite.id,
      tokenHash,
      expiresAt,
    });

    await this.auditService.log({
      action: 'users.invite_resent',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'staff_invite',
      targetId: inviteId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { requestId: context.requestId, email: invite.email },
    });

    return {
      id: invite.id,
      email: invite.email,
      fullName: invite.full_name,
      role: invite.role,
      expiresAt,
      inviteToken: token,
    };
  }

  async listSessions(currentUser: AuthUser): Promise<SessionResponse[]> {
    const sessions = await this.usersRepository.listSessionsByUser(currentUser.id);
    return sessions.map((session) => ({
      id: session.id,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      lastSeenAt: session.last_seen_at,
      createdAt: session.created_at,
      expiresAt: session.expires_at,
      isCurrent: session.id === currentUser.sessionId,
      isRevoked: session.revoked_at !== null,
    }));
  }

  async revokeSession(
    currentUser: AuthUser,
    sessionId: string,
    context: RequestContextData,
  ): Promise<void> {
    if (sessionId === currentUser.sessionId) {
      throw new BadRequestException('Cannot revoke current session. Use logout instead.');
    }

    const session = await this.usersRepository.findSessionByIdAndUser(sessionId, currentUser.id);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.revoked_at) {
      throw new BadRequestException('Session already revoked');
    }

    await this.usersRepository.revokeSessionById(sessionId, currentUser.id);

    await this.auditService.log({
      action: 'users.session_revoked',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'session',
      targetId: sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { requestId: context.requestId },
    });
  }

  async revokeAllOtherSessions(
    currentUser: AuthUser,
    context: RequestContextData,
  ): Promise<number> {
    const count = await this.usersRepository.revokeAllSessionsExcept(
      currentUser.id,
      currentUser.sessionId,
    );

    await this.auditService.log({
      action: 'users.all_sessions_revoked',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { requestId: context.requestId, revokedCount: count },
    });

    return count;
  }

  private defaultPermissionsForRole(role: StoreRole): string[] {
    return role === 'owner' ? ['*'] : [];
  }

  private toResponse(user: UserProfileRecord): UserProfileResponse {
    return {
      id: user.id,
      storeId: user.store_id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      permissions: user.permissions,
      isActive: user.is_active,
    };
  }

  private async hashValue(value: string): Promise<string> {
    return argon2.hash(value, { type: argon2.argon2id });
  }

  private getInviteExpiryDate(): Date {
    const ttlHours = this.configService.get<number>('INVITE_TTL_HOURS', 72);
    const millis = ttlHours * 60 * 60 * 1000;
    return new Date(Date.now() + millis);
  }

  private getPasswordResetExpiryDate(): Date {
    const ttlMinutes = this.configService.get<number>('PASSWORD_RESET_TTL_MINUTES', 60);
    const millis = ttlMinutes * 60 * 1000;
    return new Date(Date.now() + millis);
  }
}
