import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Req, UseGuards } from '@nestjs/common';
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
import { CreateThemePreviewTokenDto } from './dto/create-theme-preview-token.dto';
import { UpdateThemeDraftDto } from './dto/update-theme-draft.dto';
import { ThemePreviewTokenResponse, ThemesService, type ThemeStateResponse } from './themes.service';

@ApiTags('themes')
@ApiBearerAuth()
@Controller('themes')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Get('draft')
  @RequirePermissions(PERMISSIONS.themesRead)
  @ApiOkResponse({ description: 'Get draft and published theme state' })
  async getDraft(@CurrentUser() currentUser: AuthUser): Promise<ThemeStateResponse> {
    return this.themesService.getDraft(currentUser);
  }

  @Put('draft')
  @RequirePermissions(PERMISSIONS.themesWrite)
  @ApiOkResponse({ description: 'Update draft theme config' })
  async updateDraft(
    @CurrentUser() currentUser: AuthUser,
    @Body() body: UpdateThemeDraftDto,
    @Req() request: Request,
  ): Promise<ThemeStateResponse> {
    return this.themesService.updateDraft(currentUser, body, getRequestContext(request));
  }

  @Post('publish')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.themesWrite)
  @ApiOkResponse({ description: 'Publish current draft theme config' })
  async publish(
    @CurrentUser() currentUser: AuthUser,
    @Req() request: Request,
  ): Promise<ThemeStateResponse> {
    return this.themesService.publish(currentUser, getRequestContext(request));
  }

  @Post('preview-token')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.themesWrite)
  @ApiOkResponse({ description: 'Create short-lived preview token for draft theme' })
  async createPreviewToken(
    @CurrentUser() currentUser: AuthUser,
    @Body() body: CreateThemePreviewTokenDto,
    @Req() request: Request,
  ): Promise<ThemePreviewTokenResponse> {
    return this.themesService.createPreviewToken(currentUser, body, getRequestContext(request));
  }
}
