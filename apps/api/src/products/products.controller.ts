import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { PERMISSIONS } from '../auth/constants/permission.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { getRequestContext } from '../common/utils/request-context.util';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { TenantGuard } from '../tenancy/guards/tenant.guard';
import { AttachProductImageDto } from './dto/attach-product-image.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateVariantAttributesDto } from './dto/update-variant-attributes.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ProductsService,
  type ProductExcelImportResultResponse,
  type ProductImageResponse,
  type ProductListResponse,
  type ProductResponse,
  type ProductVariantResponse,
} from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.productsWrite)
  @ApiOkResponse({ description: 'Create product' })
  async create(
    @CurrentUser() currentUser: AuthUser,
    @Body() body: CreateProductDto,
    @Req() request: Request,
  ): Promise<ProductResponse> {
    return this.productsService.create(currentUser, body, getRequestContext(request));
  }

  @Get()
  @RequirePermissions(PERMISSIONS.productsRead)
  @ApiOkResponse({ description: 'List products' })
  async list(
    @CurrentUser() currentUser: AuthUser,
    @Query() query: ListProductsQueryDto,
  ): Promise<ProductListResponse> {
    return this.productsService.list(currentUser, query);
  }

  @Get('export/excel')
  @RequirePermissions(PERMISSIONS.productsRead)
  @ApiOkResponse({ description: 'Export products as Excel file' })
  async exportExcel(
    @CurrentUser() currentUser: AuthUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Buffer> {
    const fileName = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;
    response.setHeader(
      'content-type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader('content-disposition', `attachment; filename="${fileName}"`);
    return this.productsService.exportToExcel(currentUser);
  }

  @Post('import/excel')
  @RequirePermissions(PERMISSIONS.productsWrite)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @ApiOkResponse({ description: 'Import products from Excel file' })
  async importExcel(
    @CurrentUser() currentUser: AuthUser,
    @UploadedFile() file: { buffer: Buffer } | undefined,
    @Req() request: Request,
  ): Promise<ProductExcelImportResultResponse> {
    if (!file?.buffer) {
      throw new BadRequestException('Import file is required');
    }
    return this.productsService.importFromExcel(
      currentUser,
      file.buffer,
      getRequestContext(request),
    );
  }

  @Get(':productId')
  @RequirePermissions(PERMISSIONS.productsRead)
  @ApiOkResponse({ description: 'Get product details' })
  async getById(
    @CurrentUser() currentUser: AuthUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<ProductResponse> {
    return this.productsService.getById(currentUser, productId);
  }

  @Put(':productId')
  @RequirePermissions(PERMISSIONS.productsWrite)
  @ApiOkResponse({ description: 'Update product' })
  async update(
    @CurrentUser() currentUser: AuthUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() body: UpdateProductDto,
    @Req() request: Request,
  ): Promise<ProductResponse> {
    return this.productsService.update(currentUser, productId, body, getRequestContext(request));
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.productsWrite)
  async remove(
    @CurrentUser() currentUser: AuthUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.productsService.delete(currentUser, productId, getRequestContext(request));
  }

  @Post(':productId/variants')
  @RequirePermissions(PERMISSIONS.productsWrite)
  @ApiOkResponse({ description: 'Create product variant' })
  async addVariant(
    @CurrentUser() currentUser: AuthUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() body: CreateVariantDto,
    @Req() request: Request,
  ): Promise<ProductVariantResponse> {
    return this.productsService.addVariant(
      currentUser,
      productId,
      body,
      getRequestContext(request),
    );
  }

  @Put(':productId/variants/:variantId/attributes')
  @RequirePermissions(PERMISSIONS.productsWrite)
  @ApiOkResponse({ description: 'Replace variant attribute values' })
  async updateVariantAttributes(
    @CurrentUser() currentUser: AuthUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() body: UpdateVariantAttributesDto,
    @Req() request: Request,
  ): Promise<ProductVariantResponse> {
    return this.productsService.updateVariantAttributes(
      currentUser,
      productId,
      variantId,
      body.attributeValueIds,
      getRequestContext(request),
    );
  }

  @Post(':productId/images')
  @RequirePermissions(PERMISSIONS.productsWrite, PERMISSIONS.mediaWrite)
  @ApiOkResponse({ description: 'Attach uploaded media to product image gallery' })
  async attachImage(
    @CurrentUser() currentUser: AuthUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() body: AttachProductImageDto,
    @Req() request: Request,
  ): Promise<ProductImageResponse> {
    return this.productsService.attachImage(
      currentUser,
      productId,
      body,
      getRequestContext(request),
    );
  }
}
