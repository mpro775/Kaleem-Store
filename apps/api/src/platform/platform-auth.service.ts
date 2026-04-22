import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { StringValue } from 'ms';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import type { RequestContextData } from '../common/utils/request-context.util';
import { parseRefreshToken } from '../auth/utils/refresh-token.util';
import type { PlatformLoginDto } from './dto/platform-login.dto';
import type { PlatformRefreshTokenDto } from './dto/platform-refresh-token.dto';
import type { PlatformAuthResult } from './interfaces/platform-auth-result.interface';
import type { PlatformAccessTokenPayload } from './interfaces/platform-access-token-payload.interface';
import type { PlatformAdminUser } from './interfaces/platform-admin-user.interface';
import { PlatformAuthRepository } from './platform-auth.repository';

@Injectable()
export class PlatformAuthService {
  constructor(
    private readonly platformAuthRepository: PlatformAuthRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(input: PlatformLoginDto, context: RequestContextData): Promise<PlatformAuthResult> {
    const admin = await this.platformAuthRepository.findAdminByEmail(
      input.email.trim().toLowerCase(),
    );

    const valid = admin && (await argon2.verify(admin.password_hash, input.password));
    if (!admin || !valid || admin.status !== 'active') {
      await this.auditService.log({
        action: 'platform.auth.login_failed',
        storeId: null,
        storeUserId: null,
        targetType: 'platform_admin_user',
        ...(admin ? { targetId: admin.id } : {}),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: {
          email: input.email.trim().toLowerCase(),
          requestId: context.requestId,
        },
      });
      throw new UnauthorizedException('Invalid platform admin credentials');
    }

    await this.platformAuthRepository.touchAdminLastLogin(admin.id);
    const result = await this.issueTokens(admin.id, context);

    await this.auditService.log({
      action: 'platform.auth.login_succeeded',
      storeId: null,
      storeUserId: null,
      targetType: 'platform_admin_user',
      targetId: admin.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
      },
    });

    return result;
  }

  async refresh(
    input: PlatformRefreshTokenDto,
    context: RequestContextData,
  ): Promise<PlatformAuthResult> {
    const parsed = parseRefreshToken(input.refreshToken);
    if (!parsed) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    const session = await this.platformAuthRepository.findSessionById(parsed.sessionId);
    if (!session || session.revoked_at || session.expires_at.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const validSecret = await argon2.verify(session.refresh_token_hash, parsed.secret);
    if (!validSecret) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const admin = await this.platformAuthRepository.findAdminById(session.admin_user_id);
    if (!admin || admin.status !== 'active') {
      throw new UnauthorizedException('Platform admin account is not active');
    }

    const result = await this.issueTokens(admin.id, context, session.id);

    await this.auditService.log({
      action: 'platform.auth.refresh_succeeded',
      storeId: null,
      storeUserId: null,
      targetType: 'platform_admin_user',
      targetId: admin.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
      },
    });

    return result;
  }

  async logout(currentUser: PlatformAdminUser, context: RequestContextData): Promise<void> {
    await this.platformAuthRepository.revokeSession(currentUser.sessionId);

    await this.auditService.log({
      action: 'platform.auth.logout',
      storeId: null,
      storeUserId: null,
      targetType: 'platform_admin_user',
      targetId: currentUser.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
      },
    });
  }

  async me(currentUser: PlatformAdminUser): Promise<PlatformAdminUser> {
    const admin = await this.platformAuthRepository.findAdminById(currentUser.id);
    if (!admin || admin.status !== 'active') {
      throw new UnauthorizedException('Platform admin account is not active');
    }

    const permissions = await this.platformAuthRepository.listAdminPermissions(admin.id);
    const roleCodes = await this.platformAuthRepository.listAdminRoleCodes(admin.id);

    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.full_name,
      status: admin.status,
      permissions,
      roleCodes,
      sessionId: currentUser.sessionId,
    };
  }

  private async issueTokens(
    adminId: string,
    context: RequestContextData,
    existingSessionId?: string,
  ): Promise<PlatformAuthResult> {
    const admin = await this.platformAuthRepository.findAdminById(adminId);
    if (!admin || admin.status !== 'active') {
      throw new UnauthorizedException('Platform admin account is not active');
    }

    const permissions = await this.platformAuthRepository.listAdminPermissions(admin.id);
    const roleCodes = await this.platformAuthRepository.listAdminRoleCodes(admin.id);

    const refreshTtlDays = this.configService.get<number>('REFRESH_TOKEN_TTL_DAYS', 30);
    const refreshExpiryDate = new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000);
    const refreshTokenSecret = randomBytes(32).toString('base64url');
    const refreshTokenHash = await argon2.hash(refreshTokenSecret);

    let sessionId = existingSessionId;
    if (sessionId) {
      const rotated = await this.platformAuthRepository.rotateSession({
        sessionId,
        refreshTokenHash,
        expiresAt: refreshExpiryDate,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      if (!rotated) {
        throw new UnauthorizedException('Unable to refresh platform session');
      }
    } else {
      const created = await this.platformAuthRepository.createSession({
        adminUserId: admin.id,
        refreshTokenHash,
        expiresAt: refreshExpiryDate,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      sessionId = created.id;
    }

    const payload: PlatformAccessTokenPayload = {
      sub: admin.id,
      sid: sessionId,
      email: admin.email,
      fullName: admin.full_name,
      permissions,
      roleCodes,
      kind: 'platform_admin',
    };

    const jwtSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    const expiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as StringValue;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn,
    });

    return {
      accessToken,
      refreshToken: `${sessionId}.${refreshTokenSecret}`,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        status: admin.status,
        permissions,
        roleCodes,
        sessionId,
      },
    };
  }
}
